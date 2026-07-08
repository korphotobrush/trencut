"use client";

// api.openai.com은 브라우저 fetch 직접 호출을 CORS로 차단한다 (확인됨).
// 그래서 실제 OpenAI 호출은 서버 라우트 /api/generate(Workers 스트리밍 프록시)가
// 대신 수행하고, 여기서는 그 라우트를 호출해 SSE 스트림을 받아 텍스트로 조립한다.
// Worker는 스트림을 그대로 흘려보내기만 하므로 대기시간 동안 CPU를 쓰지 않는다
// (README "운영비용 최소화 원칙" 유지).

export async function getMyDecryptedKey(provider: "openai" | "naver_open" | "naver_searchad") {
  const res = await fetch(`/api/keys/${provider}/reveal`);
  if (!res.ok) {
    throw new Error("등록된 API 키가 없거나 로그인이 필요합니다.");
  }
  const { value } = (await res.json()) as { value: string };
  return value;
}

export async function generateDetailPageText(params: {
  imageDescription: string;
  advancedPrompt?: string;
  onChunk?: (textSoFar: string) => void;
}) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageDescription: params.imageDescription,
      advancedPrompt: params.advancedPrompt,
    }),
  });

  if (!res.ok || !res.body) {
    const errText = await res.text();
    throw new Error(`생성 실패: ${errText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let resultText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content ?? "";
        if (delta) {
          resultText += delta;
          params.onChunk?.(resultText);
        }
      } catch {
        // 불완전한 청크는 무시하고 다음 라인에서 이어붙임
      }
    }
  }

  return resultText;
}

export async function saveProjectResult(projectId: string, resultText: string) {
  await fetch(`/api/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resultText, status: "done" }),
  });
}

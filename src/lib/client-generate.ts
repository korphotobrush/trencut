"use client";

import { parsePromptFields, type PromptFields } from "./prompt-fields";

// api.openai.com / generativelanguage.googleapis.com은 브라우저 fetch 직접 호출을
// CORS로 차단한다 (확인됨). 그래서 실제 호출은 서버 라우트 /api/generate가 대신
// 수행하고, 여기서는 완성된 구조화 JSON을 그대로 받아온다.

export async function getMyDecryptedKey(provider: "openai" | "gemini" | "naver_open" | "naver_searchad") {
  const res = await fetch(`/api/keys/${provider}/reveal`);
  if (!res.ok) {
    throw new Error("등록된 API 키가 없거나 로그인이 필요합니다.");
  }
  const { value } = (await res.json()) as { value: string };
  return value;
}

export async function suggestPromptFields(params: {
  images: { base64: string; mimeType: string }[];
  advancedPrompt?: string;
}): Promise<PromptFields> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      images: params.images,
      advancedPrompt: params.advancedPrompt,
    }),
  });

  const data = (await res.json()) as { raw?: string; error?: string };
  if (!res.ok || !data.raw) {
    throw new Error(`추천 실패: ${data.error ?? "알 수 없는 오류"}`);
  }
  return parsePromptFields(data.raw);
}

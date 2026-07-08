import { NextRequest, NextResponse } from "next/server";
import { getDB, getEnv } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { decryptValue } from "@/lib/crypto";

// 브라우저는 api.openai.com을 직접 호출할 수 없다 (CORS로 차단됨 — 확인됨).
// 그래서 이 라우트가 대신 OpenAI를 호출하고, 응답 스트림을 그대로 클라이언트에
// 흘려보낸다. Worker는 스트림 전달만 담당하므로 대기 시간 동안 CPU를 쓰지 않는다
// (README "운영비용 최소화 원칙" 유지).
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { imageDescription, advancedPrompt } = (await req.json()) as {
    imageDescription: string;
    advancedPrompt?: string;
  };
  if (!imageDescription)
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });

  const row = await getDB()
    .prepare("SELECT encrypted_value FROM api_keys WHERE user_id = ? AND provider = ?")
    .bind(session.userId, "openai")
    .first<{ encrypted_value: string }>();
  if (!row)
    return NextResponse.json({ error: "등록된 OpenAI 키가 없습니다." }, { status: 404 });
  const apiKey = await decryptValue(row.encrypted_value, getEnv().ENCRYPTION_KEY);

  const systemPrompt =
    "너는 한국 이커머스 상세페이지 카피라이터야. 업로드된 상품 이미지 설명을 바탕으로 " +
    "한글 상세페이지 문구를 자연스럽게 작성해줘.";
  const userPrompt = advancedPrompt
    ? `${imageDescription}\n\n추가 지시사항: ${advancedPrompt}`
    : imageDescription;

  const requestBody = JSON.stringify({
    model: "gpt-4o-mini",
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  // Cloudflare Workers는 요청마다 전 세계 여러 엣지 서버(colo) 중 하나에서 실행되는데,
  // 가끔 OpenAI가 막아둔 지역(홍콩 등)의 colo를 거치면서 실제로는 한국에서 보낸 요청인데도
  // "unsupported_country_region_territory" 에러가 난다 — Cloudflare/OpenAI 양쪽에 알려진
  // 인프라 이슈. 같은 요청도 다른 colo로 재시도하면 성공하는 경우가 많아서 몇 번 재시도한다.
  let openaiRes: Response | null = null;
  let lastErrText = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: requestBody,
    });
    if (res.ok) {
      openaiRes = res;
      break;
    }
    lastErrText = await res.text();
    if (!lastErrText.includes("unsupported_country_region_territory")) {
      // 지역 문제가 아닌 다른 에러(키 오류 등)는 재시도해도 소용없으니 바로 반환
      return NextResponse.json({ error: `OpenAI 호출 실패: ${lastErrText}` }, { status: 502 });
    }
  }

  if (!openaiRes || !openaiRes.body) {
    return NextResponse.json(
      {
        error:
          "OpenAI 호출 실패: Cloudflare 서버가 일시적으로 OpenAI 차단 지역을 거쳐서 발생한 문제로 보입니다 " +
          "(여러 번 재시도했지만 실패). 잠시 후 다시 시도해주세요.",
      },
      { status: 502 }
    );
  }

  return new Response(openaiRes.body, {
    headers: { "Content-Type": "text/event-stream" },
  });
}

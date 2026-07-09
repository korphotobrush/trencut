import { NextRequest, NextResponse } from "next/server";
import { getDB, getEnv } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { decryptValue } from "@/lib/crypto";

// 브라우저는 api.openai.com / generativelanguage.googleapis.com을 직접 호출할 수 없다
// (CORS로 차단됨 — 확인됨). 그래서 이 라우트가 대신 호출한다.
// 이 라우트는 최종 이미지를 만들지 않고, 업로드된 상품 사진을 보고 사용자가 편집할
// "프롬프트 재료"(PromptFields)만 JSON으로 추천한다 — 텍스트 전용 모델만 쓰므로
// (이미지 생성 모델과 달리) Gemini 무료 티어로 충분히 커버된다.
const SCHEMA_PROMPT = `너는 이커머스 상품 상세페이지용 AI 이미지 생성 프롬프트를 만들어주는 어시스턴트야.
첨부된 상품 이미지 1~5장을 보고, 그 상품을 상세페이지에 쓸 사실적인 상품 사진으로
재구성하는 프롬프트 재료를 아래 JSON 스키마로 한글로 제안해. 여러 장이 첨부됐다면 같은
상품의 서로 다른 각도/디테일 사진이니 모두 참고해서 종합적으로 작성해. 반드시 JSON 객체
하나만 출력하고, 코드펜스나 다른 설명 문장은 절대 포함하지 마.

기본 톤: 일러스트/3D 렌더링 느낌이 아니라 아이폰으로 찍은 듯한 자연스럽고 사실적인 사진
스타일을 기본값으로 제안해. scene과 lighting도 실제로 존재할 법한 현실적인 장소/조명으로
제안하고(예: 스튜디오, 원목 테이블, 창가, 카페 등), 초현실적이거나 판타지적인 연출은 피해.

스키마:
{
  "productName": "상품을 짧게 부르는 이름 (10자 내외)",
  "scene": "상품을 재배치할 사실적인 장면/상황 한 문장 (예: 원목 테이블 위 오전 창가 자연광)",
  "background": "사실적인 배경 컨셉 한 문장",
  "details": ["원본 이미지에서 반드시 그대로 유지해야 할 상품의 디테일(색상/로고/소재/형태 등)을 3~6개, 각 항목은 6자 내외"],
  "lighting": ["실제 촬영에서 쓸 법한 조명 컨셉을 1~2개, 각 항목은 10자 내외"],
  "hashtags": ["상품 분위기를 나타내는 해시태그 2~4개, # 없이 단어만"]
}

이미지에 실제로 보이는 색상·형태·소재·디자인 요소를 최대한 구체적으로 반영하고,
이미지와 무관한 내용은 지어내지 마.`;

type ImageInput = { base64: string; mimeType: string };

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { images, advancedPrompt } = (await req.json()) as {
    images: ImageInput[];
    advancedPrompt?: string;
  };
  if (!images || images.length === 0)
    return NextResponse.json({ error: "이미지를 먼저 업로드해주세요." }, { status: 400 });

  // Gemini는 무료 티어가 있어 등록돼 있으면 우선 사용하고, 없으면 OpenAI로 대체한다.
  const { results } = await getDB()
    .prepare("SELECT provider, encrypted_value FROM api_keys WHERE user_id = ? AND provider IN ('gemini','openai')")
    .bind(session.userId)
    .all<{ provider: string; encrypted_value: string }>();
  const geminiRow = results.find((r) => r.provider === "gemini");
  const openaiRow = results.find((r) => r.provider === "openai");
  if (!geminiRow && !openaiRow)
    return NextResponse.json({ error: "등록된 Gemini 또는 OpenAI 키가 없습니다." }, { status: 404 });

  const baseInstruction = `이 상품 이미지 ${images.length}장을 분석해서 위 스키마에 맞는 JSON을 제안해줘.`;
  const userPrompt = advancedPrompt ? `${baseInstruction}\n\n추가 지시사항: ${advancedPrompt}` : baseInstruction;

  if (geminiRow) {
    const apiKey = await decryptValue(geminiRow.encrypted_value, getEnv().ENCRYPTION_KEY);
    return callGemini(apiKey, userPrompt, images);
  }
  const apiKey = await decryptValue(openaiRow!.encrypted_value, getEnv().ENCRYPTION_KEY);
  return callOpenAI(apiKey, userPrompt, images);
}

async function callOpenAI(apiKey: string, userPrompt: string, images: ImageInput[]) {
  const requestBody = JSON.stringify({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SCHEMA_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          ...images.map((img) => ({
            type: "image_url",
            image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
          })),
        ],
      },
    ],
  });

  // Cloudflare Workers는 요청마다 전 세계 여러 엣지 서버(colo) 중 하나에서 실행되는데,
  // 가끔 OpenAI가 막아둔 지역(홍콩 등)의 colo를 거치면서 실제로는 한국에서 보낸 요청인데도
  // "unsupported_country_region_territory" 에러가 난다 — Cloudflare/OpenAI 양쪽에 알려진
  // 인프라 이슈. 같은 요청도 다른 colo로 재시도하면 성공하는 경우가 많아서 몇 번 재시도한다.
  let lastErrText = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: requestBody,
    });
    if (res.ok) {
      const data = await res.json<{ choices: { message: { content: string } }[] }>();
      const raw = data.choices?.[0]?.message?.content ?? "";
      return NextResponse.json({ raw });
    }
    lastErrText = await res.text();
    if (!lastErrText.includes("unsupported_country_region_territory")) {
      return NextResponse.json({ error: `OpenAI 호출 실패: ${lastErrText}` }, { status: 502 });
    }
  }

  return NextResponse.json(
    {
      error:
        "OpenAI 호출 실패: Cloudflare 서버가 일시적으로 OpenAI 차단 지역을 거쳐서 발생한 문제로 보입니다 " +
        "(여러 번 재시도했지만 실패). 잠시 후 다시 시도해주세요.",
    },
    { status: 502 }
  );
}

async function callGemini(apiKey: string, userPrompt: string, images: ImageInput[]) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SCHEMA_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [
              { text: userPrompt },
              ...images.map((img) => ({ inlineData: { mimeType: img.mimeType, data: img.base64 } })),
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    return NextResponse.json({ error: `Gemini 호출 실패: ${errText}` }, { status: 502 });
  }
  const data = await res.json<{ candidates?: { content?: { parts?: { text?: string }[] } }[] }>();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return NextResponse.json({ raw });
}

// AI가 업로드된 상품 사진을 보고 추천하는 "프롬프트 재료"의 구조.
// 사용자가 각 필드를 직접 수정할 수 있고, buildFinalPrompt로 하나의 완성된 프롬프트
// 텍스트를 만들어서 복사 → ChatGPT 등 외부 이미지 생성 도구로 가져가는 데 쓴다.
export type PromptFields = {
  productName: string;
  scene: string;
  background: string;
  details: string[];
  lighting: string[];
  hashtags: string[];
};

export const EMPTY_PROMPT_FIELDS: PromptFields = {
  productName: "",
  scene: "",
  background: "",
  details: [],
  lighting: [],
  hashtags: [],
};

// 모델이 JSON 모드로 응답해도 코드펜스를 붙이거나 필드를 빠뜨리는 경우가 있어
// 방어적으로 파싱하고 누락된 값은 빈 기본값으로 채운다.
export function parsePromptFields(raw: string): PromptFields {
  const cleaned = raw
    .trim()
    .replace(/^```(json)?/i, "")
    .replace(/```$/, "")
    .trim();
  let parsed: Partial<PromptFields> = {};
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = {};
  }
  return {
    ...EMPTY_PROMPT_FIELDS,
    ...parsed,
    details: Array.isArray(parsed.details) ? parsed.details.filter(Boolean) : [],
    lighting: Array.isArray(parsed.lighting) ? parsed.lighting.filter(Boolean) : [],
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.filter(Boolean) : [],
  };
}

// 편집 가능한 필드들을 하나의 완성된 프롬프트 텍스트로 조립한다.
// ChatGPT 이미지 생성에 그대로 붙여넣어 "이 상품 사진을 기반으로 상세페이지를
// 완성된 한 장의 이미지로 만들어줘"라고 한 번에 요청할 수 있는 형태(Creative Brief
// 스타일)로 구성했다 — 결과물은 상품 사진 한 장이 아니라 "상세페이지 자체"여야 한다.
// 기본값은 항상 "상세페이지 완성본" + "아이폰으로 찍은 듯한 사실적인 사진" 스타일로
// 고정한다 (AI가 추천한 필드 내용과 무관하게 매번 이 두 가지는 프롬프트에 박혀 있어야 함).
export function buildFinalPrompt(f: PromptFields): string {
  const lines: string[] = [];
  lines.push("[Creative Brief]");
  lines.push(
    `첨부된 상품 사진을 기반으로 상품의 형태·색상·로고·질감은 그대로 유지하면서 "${f.productName || "상품"}"의 ` +
      "이커머스 상세페이지를 완성된 형태의 한 장의 이미지로 제작한다. 상품 사진 한 장만 만드는 것이 아니라, " +
      "실제 판매 페이지에 바로 올릴 수 있는 세로형 상세페이지 전체를 결과물로 만든다."
  );
  lines.push(
    "일러스트, 3D 렌더링, 그림 같은 느낌은 피하고 아이폰으로 찍은 듯한 자연스럽고 사실적인 사진 스타일로 만든다 " +
      "(자연광, 실제 카메라 렌즈 질감, 미세한 노이즈와 초점 흐림 정도의 사실감)."
  );
  lines.push("원본 이미지의 상품 정체성과 비율을 최대한 유지해 다시 만들 수 있는 프롬프트로 작성한다.");
  lines.push("");
  lines.push("[Depiction]");
  if (f.scene) lines.push(`히어로(메인) 장면은 ${f.scene}로 구성한다.`);
  if (f.background) lines.push(`배경은 ${f.background}로 구성한다.`);
  if (f.lighting.length) lines.push(`조명은 ${f.lighting.join(", ")}.`);
  lines.push("");
  lines.push("[Object]");
  lines.push(`핵심 대상은 ${f.productName || "상품"}이다.`);
  if (f.details.length) lines.push(`유지해야 할 디테일: ${f.details.join(", ")}.`);
  lines.push("상품의 형태와 비율은 원본과 동일하게, 로고·텍스트·색상은 왜곡 없이 유지한다.");
  lines.push("");
  lines.push("[Page Composition]");
  lines.push(
    "세로로 긴 한 장의 상세페이지 레이아웃으로 구성한다: 상단 히어로 섹션(상품 메인 컷 + 짧은 헤드카피), " +
      "중단 특징/장점 소개 섹션(2~3개), 사용 장면 또는 디테일 컷, 하단 구매 유도 마무리 섹션 순서로 배치한다."
  );
  lines.push("각 섹션의 한글 문구는 짧고 자연스럽게, 실제 상세페이지처럼 보이도록 이미지 안에 함께 그려 넣는다.");
  lines.push("");
  lines.push("[Deliverable]");
  lines.push(
    "상기 이미지를 기반으로 해당 제품에 대한 상세페이지를 제작한다. 여러 장으로 나누지 말고, " +
      "위 구성을 모두 포함한 하나의 완성된 세로형 상세페이지 이미지로 결과물을 만들어줘."
  );
  if (f.hashtags.length) {
    lines.push("");
    lines.push(f.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" "));
  }
  return lines.join("\n");
}

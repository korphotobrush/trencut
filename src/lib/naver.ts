// 네이버 API 2종을 직접 호출하는 서버 전용 헬퍼.
// - fetchSearchAdKeywords: "검색광고 키워드도구" API → 연관키워드 + 월간 PC/모바일 검색량 + 경쟁도
// - fetchDataLabTrend: "오픈API 데이터랩 검색어트렌드" API → 기간별 상대 검색량 추이(그래프용)
// 둘 다 사용자 본인의 API 키로 호출한다 (서버는 중계만 하고 자체 키를 쓰지 않음).

export type SearchAdCreds = { customerId: string; accessLicense: string; secretKey: string };
export type NaverOpenCreds = { clientId: string; clientSecret: string };

export type SearchAdKeywordRow = {
  relKeyword: string;
  monthlyPcQcCnt: number | string; // 검색량이 아주 적으면 "< 10" 문자열로 옴
  monthlyMobileQcCnt: number | string;
  compIdx: string; // "낮음" | "중간" | "높음"
};

export type DataLabTrendPoint = { period: string; ratio: number };

// 검색광고 API는 매 요청마다 "타임스탬프.메서드.URI"를 비밀키로 HMAC-SHA256 서명해서
// 헤더로 같이 보내야 한다 (Web Crypto API는 Workers 런타임에서도 그대로 동작).
async function signSearchAdRequest(
  timestamp: string,
  method: string,
  uri: string,
  secretKey: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const message = `${timestamp}.${method}.${uri}`;
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export async function fetchSearchAdKeywords(
  creds: SearchAdCreds,
  hintKeyword: string
): Promise<SearchAdKeywordRow[]> {
  const uri = "/keywordstool";
  const timestamp = String(Date.now());
  const signature = await signSearchAdRequest(timestamp, "GET", uri, creds.secretKey);

  const url = `https://api.searchad.naver.com${uri}?hintKeywords=${encodeURIComponent(hintKeyword)}&showDetail=1`;
  const res = await fetch(url, {
    headers: {
      "X-Timestamp": timestamp,
      "X-API-KEY": creds.accessLicense,
      "X-Customer": creds.customerId,
      "X-Signature": signature,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`검색광고 API 호출 실패 (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { keywordList: SearchAdKeywordRow[] };
  return data.keywordList ?? [];
}

export async function fetchDataLabTrend(
  creds: NaverOpenCreds,
  keyword: string
): Promise<DataLabTrendPoint[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6); // 최근 6개월 추이
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const res = await fetch("https://openapi.naver.com/v1/datalab/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Naver-Client-Id": creds.clientId,
      "X-Naver-Client-Secret": creds.clientSecret,
    },
    body: JSON.stringify({
      startDate: fmt(startDate),
      endDate: fmt(endDate),
      timeUnit: "week",
      keywordGroups: [{ groupName: keyword, keywords: [keyword] }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`데이터랩 API 호출 실패 (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { results: { data: DataLabTrendPoint[] }[] };
  return data.results?.[0]?.data ?? [];
}

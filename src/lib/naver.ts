// 네이버 API 여러 개를 직접 호출하는 서버 전용 헬퍼.
// - fetchSearchAdKeywords: "검색광고 키워드도구" → 연관키워드 + 월간 PC/모바일 검색량 + 경쟁도
// - fetchDataLabTrend: "오픈API 데이터랩 검색어트렌드" → 기간별 상대 검색량 추이 (최대 5개 키워드 비교)
// - fetchWeekdayDistribution / fetchGenderDistribution / fetchAgeDistribution:
//   데이터랩 API는 요일별/연령대별 분포를 통째로 주는 기능은 없지만, device/gender/ages
//   필터를 걸어서 여러 번 나눠 부르면 직접 계산할 수 있다 (네이버 공식 문서 확인됨).
// - fetchContentTotals: 블로그/카페글 검색 API의 total 필드로 "총 발행량" 근사치를 구함.
// 전부 사용자 본인의 API 키로 호출한다 (서버는 중계만 하고 자체 키를 쓰지 않음).

export type SearchAdCreds = { customerId: string; accessLicense: string; secretKey: string };
export type NaverOpenCreds = { clientId: string; clientSecret: string };

export type SearchAdKeywordRow = {
  relKeyword: string;
  monthlyPcQcCnt: number | string; // 검색량이 아주 적으면 "< 10" 문자열로 옴
  monthlyMobileQcCnt: number | string;
  compIdx: string; // "낮음" | "중간" | "높음"
};

export type TrendSeries = { title: string; data: { period: string; ratio: number }[] };

const AGE_LABELS: Record<string, string> = {
  "1": "0-12세", "2": "13-18세", "3": "19-24세", "4": "25-29세", "5": "30-34세",
  "6": "35-39세", "7": "40-44세", "8": "45-49세", "9": "50-54세", "10": "55-59세", "11": "60세 이상",
};
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

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
  if (!res.ok) throw new Error(`검색광고 API 호출 실패 (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { keywordList: SearchAdKeywordRow[] };
  return data.keywordList ?? [];
}

function last6MonthsRange() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(startDate), endDate: fmt(endDate) };
}

async function callDataLab(
  creds: NaverOpenCreds,
  body: Record<string, unknown>
): Promise<{ results: { title: string; data: { period: string; ratio: number }[] }[] }> {
  const res = await fetch("https://openapi.naver.com/v1/datalab/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Naver-Client-Id": creds.clientId,
      "X-Naver-Client-Secret": creds.clientSecret,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`데이터랩 API 호출 실패 (${res.status}): ${await res.text()}`);
  return res.json();
}

// keywords: 메인 키워드 + 비교하고 싶은 키워드들 (최대 5개, 데이터랩 keywordGroups 제한)
export async function fetchDataLabTrend(creds: NaverOpenCreds, keywords: string[]): Promise<TrendSeries[]> {
  const { startDate, endDate } = last6MonthsRange();
  const data = await callDataLab(creds, {
    startDate,
    endDate,
    timeUnit: "week",
    keywordGroups: keywords.slice(0, 5).map((k) => ({ groupName: k, keywords: [k] })),
  });
  return data.results.map((r) => ({ title: r.title, data: r.data }));
}

// timeUnit=date로 일 단위 데이터를 받아서 요일별 평균을 직접 계산한다 (API가 자체적으로 주지 않음)
export async function fetchWeekdayDistribution(
  creds: NaverOpenCreds,
  keyword: string
): Promise<{ day: string; avgRatio: number }[]> {
  const { startDate, endDate } = last6MonthsRange();
  const data = await callDataLab(creds, {
    startDate,
    endDate,
    timeUnit: "date",
    keywordGroups: [{ groupName: keyword, keywords: [keyword] }],
  });
  const points = data.results[0]?.data ?? [];
  const sums = new Array(7).fill(0);
  const counts = new Array(7).fill(0);
  for (const p of points) {
    const weekday = new Date(p.period).getDay(); // 0=일 ~ 6=토
    sums[weekday] += p.ratio;
    counts[weekday] += 1;
  }
  return WEEKDAY_LABELS.map((day, i) => ({
    day,
    avgRatio: counts[i] ? Math.round((sums[i] / counts[i]) * 10) / 10 : 0,
  }));
}

// 데이터랩은 "성별 분포"를 한 번에 안 주기 때문에 gender=m / gender=f로 각각 호출해서 비율을 만든다
export async function fetchGenderDistribution(
  creds: NaverOpenCreds,
  keyword: string
): Promise<{ male: number; female: number }> {
  const { startDate, endDate } = last6MonthsRange();
  const base = { startDate, endDate, timeUnit: "month" as const, keywordGroups: [{ groupName: keyword, keywords: [keyword] }] };
  const [male, female] = await Promise.all([
    callDataLab(creds, { ...base, gender: "m" }),
    callDataLab(creds, { ...base, gender: "f" }),
  ]);
  const sum = (r: { results: { data: { ratio: number }[] }[] }) =>
    (r.results[0]?.data ?? []).reduce((acc, p) => acc + p.ratio, 0);
  const m = sum(male);
  const f = sum(female);
  const total = m + f || 1;
  return { male: Math.round((m / total) * 1000) / 10, female: Math.round((f / total) * 1000) / 10 };
}

// 연령대 11개 구간을 병렬로 호출해서 상대 비율을 만든다 (구간별로 따로 부르는 것 외엔 방법이 없음)
export async function fetchAgeDistribution(
  creds: NaverOpenCreds,
  keyword: string
): Promise<{ ageLabel: string; ratio: number }[]> {
  const { startDate, endDate } = last6MonthsRange();
  const base = { startDate, endDate, timeUnit: "month" as const, keywordGroups: [{ groupName: keyword, keywords: [keyword] }] };
  const ageCodes = Object.keys(AGE_LABELS);
  const results = await Promise.all(
    ageCodes.map((code) => callDataLab(creds, { ...base, ages: [code] }))
  );
  const sums = results.map((r) => (r.results[0]?.data ?? []).reduce((acc, p) => acc + p.ratio, 0));
  const total = sums.reduce((a, b) => a + b, 0) || 1;
  return ageCodes.map((code, i) => ({
    ageLabel: AGE_LABELS[code],
    ratio: Math.round((sums[i] / total) * 1000) / 10,
  }));
}

// 블로그/카페글 검색 API의 total 필드로 "총 발행량"(누적 문서 수) 근사치를 구한다.
// 정확히는 네이버가 "발행량 통계"로 공식 명명한 지표는 아니고, 검색 색인 기준 총 문서 수다.
export async function fetchContentTotals(
  creds: NaverOpenCreds,
  keyword: string
): Promise<{ blog: number; cafe: number }> {
  const headers = { "X-Naver-Client-Id": creds.clientId, "X-Naver-Client-Secret": creds.clientSecret };
  const q = encodeURIComponent(keyword);
  const [blogRes, cafeRes] = await Promise.all([
    fetch(`https://openapi.naver.com/v1/search/blog.json?query=${q}&display=1`, { headers }),
    fetch(`https://openapi.naver.com/v1/search/cafearticle.json?query=${q}&display=1`, { headers }),
  ]);
  if (!blogRes.ok) throw new Error(`블로그 검색 API 호출 실패 (${blogRes.status}): ${await blogRes.text()}`);
  if (!cafeRes.ok) throw new Error(`카페글 검색 API 호출 실패 (${cafeRes.status}): ${await cafeRes.text()}`);
  const [blog, cafe] = await Promise.all([blogRes.json(), cafeRes.json()]) as [{ total: number }, { total: number }];
  return { blog: blog.total, cafe: cafe.total };
}

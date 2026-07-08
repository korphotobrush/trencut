import { NextRequest, NextResponse } from "next/server";
import { getDB, getEnv } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { decryptValue } from "@/lib/crypto";
import {
  fetchSearchAdKeywords,
  fetchDataLabTrend,
  fetchWeekdayDistribution,
  fetchGenderDistribution,
  fetchAgeDistribution,
  fetchContentTotals,
  type SearchAdCreds,
  type NaverOpenCreds,
} from "@/lib/naver";

const CACHE_TTL_SECONDS = 6 * 60 * 60;

// loword처럼 한 번 검색하면 등록해둔 키 종류에 따라 표+그래프+분포까지 한 번에 보여준다.
// (예전엔 "오픈API"/"검색광고API" 중 하나만 골라서 봐야 했는데, 둘 다 등록해뒀으면 둘 다 보여주는 게 맞다.)
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const keyword = req.nextUrl.searchParams.get("q");
  if (!keyword) return NextResponse.json({ error: "검색어가 필요합니다." }, { status: 400 });
  // 비교하고 싶은 키워드들 (데이터랩 keywordGroups 한도 때문에 메인 포함 최대 5개)
  const compareParam = req.nextUrl.searchParams.get("compare") ?? "";
  const compareKeywords = compareParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);
  const allKeywords = [keyword, ...compareKeywords];

  const db = getDB();
  const now = Math.floor(Date.now() / 1000);
  const cacheKey = allKeywords.join("|");

  const cached = await db
    .prepare("SELECT result_json, cached_at FROM keyword_cache WHERE keyword = ? AND source = ?")
    .bind(cacheKey, "combined").first<{ result_json: string; cached_at: number }>();
  if (cached && now - cached.cached_at < CACHE_TTL_SECONDS)
    return NextResponse.json({ ...JSON.parse(cached.result_json), fromCache: true });

  // 등록된 키가 있는 provider만 골라서 그만큼만 호출한다 (한쪽만 등록했으면 그 결과만 나옴)
  const rows = await db
    .prepare("SELECT provider, encrypted_value FROM api_keys WHERE user_id = ? AND provider IN ('naver_open','naver_searchad')")
    .bind(session.userId).all<{ provider: string; encrypted_value: string }>();
  const encKey = getEnv().ENCRYPTION_KEY;
  let searchAdCreds: SearchAdCreds | null = null;
  let openCreds: NaverOpenCreds | null = null;
  for (const row of rows.results) {
    const decrypted = await decryptValue(row.encrypted_value, encKey);
    if (row.provider === "naver_searchad") searchAdCreds = JSON.parse(decrypted);
    if (row.provider === "naver_open") openCreds = JSON.parse(decrypted);
  }
  if (!searchAdCreds && !openCreds)
    return NextResponse.json(
      { error: "등록된 네이버 키가 없습니다. 상단 'API 키 설정'에서 먼저 등록해주세요." },
      { status: 404 }
    );

  const missingSources: string[] = [];
  if (!searchAdCreds) missingSources.push("naver_searchad");
  if (!openCreds) missingSources.push("naver_open");

  try {
    const [keywords, trend, weekday, gender, age, totals] = await Promise.all([
      searchAdCreds ? fetchSearchAdKeywords(searchAdCreds, keyword) : Promise.resolve(undefined),
      openCreds ? fetchDataLabTrend(openCreds, allKeywords) : Promise.resolve(undefined),
      openCreds ? fetchWeekdayDistribution(openCreds, keyword) : Promise.resolve(undefined),
      openCreds ? fetchGenderDistribution(openCreds, keyword) : Promise.resolve(undefined),
      openCreds ? fetchAgeDistribution(openCreds, keyword) : Promise.resolve(undefined),
      openCreds ? fetchContentTotals(openCreds, keyword) : Promise.resolve(undefined),
    ]);

    const result = { keyword, compareKeywords, keywords, trend, weekday, gender, age, totals, missingSources };
    await db.prepare(
      `INSERT INTO keyword_cache (keyword, source, result_json, cached_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(keyword, source) DO UPDATE SET result_json = excluded.result_json, cached_at = excluded.cached_at`
    ).bind(cacheKey, "combined", JSON.stringify(result), now).run();
    return NextResponse.json({ ...result, fromCache: false });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "네이버 API 호출에 실패했습니다." }, { status: 502 });
  }
}

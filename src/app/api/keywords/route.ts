import { NextRequest, NextResponse } from "next/server";
import { getDB, getEnv } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { decryptValue } from "@/lib/crypto";
import { fetchSearchAdKeywords, fetchDataLabTrend, type SearchAdCreds, type NaverOpenCreds } from "@/lib/naver";

const CACHE_TTL_SECONDS = 6 * 60 * 60;

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const keyword = req.nextUrl.searchParams.get("q");
  const source = req.nextUrl.searchParams.get("source") ?? "naver_open";
  if (!keyword) return NextResponse.json({ error: "검색어가 필요합니다." }, { status: 400 });
  if (!["naver_open", "naver_searchad"].includes(source))
    return NextResponse.json({ error: "지원하지 않는 소스입니다." }, { status: 400 });

  const db = getDB();
  const now = Math.floor(Date.now() / 1000);

  // 같은 키워드+소스로 6시간 이내에 이미 조회한 적 있으면 네이버를 다시 호출하지 않고 캐시를 준다
  // (호출 횟수 절약 + 응답 속도 향상)
  const cached = await db
    .prepare("SELECT result_json, cached_at FROM keyword_cache WHERE keyword = ? AND source = ?")
    .bind(keyword, source).first<{ result_json: string; cached_at: number }>();
  if (cached && now - cached.cached_at < CACHE_TTL_SECONDS)
    return NextResponse.json({ ...JSON.parse(cached.result_json), fromCache: true });

  // 저장된 키를 복호화해서 provider별 자격증명을 꺼낸다.
  // naver_open/naver_searchad는 값 여러 개를 JSON으로 묶어서 저장해뒀다 (src/app/ApiKeysModal.tsx 참고).
  const row = await db
    .prepare("SELECT encrypted_value FROM api_keys WHERE user_id = ? AND provider = ?")
    .bind(session.userId, source).first<{ encrypted_value: string }>();
  if (!row)
    return NextResponse.json(
      { error: "등록된 키가 없습니다. 상단 'API 키 설정'에서 먼저 등록해주세요." },
      { status: 404 }
    );
  const decrypted = await decryptValue(row.encrypted_value, getEnv().ENCRYPTION_KEY);

  let result: { keyword: string; source: string; keywords?: unknown; trend?: unknown };
  try {
    if (source === "naver_searchad") {
      const creds = JSON.parse(decrypted) as SearchAdCreds;
      const keywords = await fetchSearchAdKeywords(creds, keyword);
      result = { keyword, source, keywords };
    } else {
      const creds = JSON.parse(decrypted) as NaverOpenCreds;
      const trend = await fetchDataLabTrend(creds, keyword);
      result = { keyword, source, trend };
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "네이버 API 호출에 실패했습니다." }, { status: 502 });
  }

  await db.prepare(
    `INSERT INTO keyword_cache (keyword, source, result_json, cached_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(keyword, source) DO UPDATE SET result_json = excluded.result_json, cached_at = excluded.cached_at`
  ).bind(keyword, source, JSON.stringify(result), now).run();
  return NextResponse.json({ ...result, fromCache: false });
}

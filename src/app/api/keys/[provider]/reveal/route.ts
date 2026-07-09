import { NextRequest, NextResponse } from "next/server";
import { getDB, getEnv } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { decryptValue } from "@/lib/crypto";

export async function GET(req: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!["naver_open", "naver_searchad", "openai", "gemini"].includes(provider))
    return NextResponse.json({ error: "잘못된 provider입니다." }, { status: 400 });
  const row = await getDB()
    .prepare("SELECT encrypted_value FROM api_keys WHERE user_id = ? AND provider = ?")
    .bind(session.userId, provider).first<{ encrypted_value: string }>();
  if (!row) return NextResponse.json({ error: "등록된 키가 없습니다." }, { status: 404 });
  const value = await decryptValue(row.encrypted_value, getEnv().ENCRYPTION_KEY);
  return NextResponse.json({ value });
}

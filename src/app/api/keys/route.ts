import { NextRequest, NextResponse } from "next/server";
import { getDB, getEnv } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { encryptValue } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const db = getDB();
  const { results } = await db
    .prepare("SELECT id, provider, is_valid, last_checked_at FROM api_keys WHERE user_id = ?")
    .bind(session.userId).all();
  return NextResponse.json({ keys: results });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const { provider, value } = (await req.json()) as { provider: string; value?: string };
  if (!["naver_open", "naver_searchad", "openai", "gemini"].includes(provider) || !value)
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  const encrypted = await encryptValue(value, getEnv().ENCRYPTION_KEY);
  const db = getDB();
  await db.prepare(
    `INSERT INTO api_keys (id, user_id, provider, encrypted_value, is_valid) VALUES (?, ?, ?, ?, 1)
     ON CONFLICT(user_id, provider) DO UPDATE SET encrypted_value = excluded.encrypted_value, is_valid = 1`
  ).bind(crypto.randomUUID(), session.userId, provider, encrypted).run();
  return NextResponse.json({ saved: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const provider = req.nextUrl.searchParams.get("provider");
  await getDB().prepare("DELETE FROM api_keys WHERE user_id = ? AND provider = ?")
    .bind(session.userId, provider).run();
  return NextResponse.json({ deleted: true });
}

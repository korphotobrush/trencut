import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { getSession } from "@/lib/auth";

const DAILY_LIMIT = 30;

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const { results } = await getDB()
    .prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC")
    .bind(session.userId).all();
  return NextResponse.json({ projects: results });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const db = getDB();
  const today = new Date().toISOString().slice(0, 10);
  const usage = await db
    .prepare("SELECT generation_count FROM daily_usage WHERE user_id = ? AND usage_date = ?")
    .bind(session.userId, today).first<{ generation_count: number }>();
  if (usage && usage.generation_count >= DAILY_LIMIT)
    return NextResponse.json({ error: "오늘의 생성 한도를 초과했습니다." }, { status: 429 });
  const { title, mode, advancedPrompt, outputFormat } = (await req.json()) as {
    title?: string;
    mode: string;
    advancedPrompt?: string;
    outputFormat: string;
  };
  if (!["auto", "advanced"].includes(mode) || !["card", "text", "both"].includes(outputFormat))
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  const id = crypto.randomUUID();
  await db.prepare(
    `INSERT INTO projects (id, user_id, title, mode, advanced_prompt, output_format, status) VALUES (?, ?, ?, ?, ?, ?, 'draft')`
  ).bind(id, session.userId, title ?? null, mode, advancedPrompt ?? null, outputFormat).run();
  await db.prepare(
    `INSERT INTO daily_usage (user_id, usage_date, generation_count) VALUES (?, ?, 1)
     ON CONFLICT(user_id, usage_date) DO UPDATE SET generation_count = generation_count + 1`
  ).bind(session.userId, today).run();
  return NextResponse.json({ id, status: "draft" });
}

import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const { resultText, resultJson, status } = (await req.json()) as {
    resultText?: string;
    resultJson?: string;
    status?: string;
  };
  const db = getDB();
  const owned = await db.prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?")
    .bind(id, session.userId).first();
  if (!owned) return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  await db.prepare(
    `UPDATE projects SET result_text = ?, result_json = ?, status = ? WHERE id = ? AND user_id = ?`
  ).bind(resultText ?? null, resultJson ?? null, status ?? "done", id, session.userId).run();
  return NextResponse.json({ saved: true });
}

import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

const ALLOWED_GROUPS = ["sidebar", "bottom", "floating_left"];

export async function GET(req: NextRequest) {
  const group = req.nextUrl.searchParams.get("group") ?? "sidebar";
  if (!ALLOWED_GROUPS.includes(group))
    return NextResponse.json({ error: "잘못된 그룹입니다." }, { status: 400 });
  const { results } = await getDB()
    .prepare("SELECT id, r2_key, link_url, sort_order FROM ad_banners WHERE slot_group = ? AND is_active = 1 ORDER BY sort_order ASC")
    .bind(group).all();
  return NextResponse.json({ banners: results });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !isAdminEmail(session.email))
    return NextResponse.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  const { slotGroup, r2Key, linkUrl, internalNote, sortOrder } = (await req.json()) as {
    slotGroup: string;
    r2Key?: string;
    linkUrl?: string;
    internalNote?: string;
    sortOrder?: number;
  };
  if (!ALLOWED_GROUPS.includes(slotGroup))
    return NextResponse.json({ error: "잘못된 그룹입니다." }, { status: 400 });
  if (linkUrl && !/^https:\/\//.test(linkUrl))
    return NextResponse.json({ error: "링크는 https:// 로 시작해야 합니다." }, { status: 400 });
  const id = crypto.randomUUID();
  await getDB().prepare(
    `INSERT INTO ad_banners (id, slot_group, sort_order, r2_key, link_url, internal_note, is_active) VALUES (?, ?, ?, ?, ?, ?, 0)`
  ).bind(id, slotGroup, sortOrder ?? 0, r2Key ?? null, linkUrl ?? null, internalNote ?? null).run();
  return NextResponse.json({ id });
}

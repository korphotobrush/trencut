import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !isAdminEmail(session.email))
    return NextResponse.json({ ok: false }, { status: 403 });
  return NextResponse.json({ ok: true, email: session.email });
}

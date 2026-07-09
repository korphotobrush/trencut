import { NextRequest, NextResponse } from "next/server";
import { getMediaBucket } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// 광고 배너 이미지는 /api/upload(개인 상품 사진용, uploads/{userId}/...)와 분리해서
// ads/ 접두사로 저장한다 — /api/media/[...key]가 ads/ 접두사만 공개로 서빙하기 때문에
// 이 경로로 올린 이미지만 방문자 브라우저에서 로그인 없이 보일 수 있다.
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !isAdminEmail(session.email))
    return NextResponse.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: "이미지 파일(jpg/png/webp/gif)만 업로드할 수 있습니다." }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "파일이 너무 큽니다 (최대 5MB)." }, { status: 400 });

  const ext = file.type.split("/")[1];
  const r2Key = `ads/${crypto.randomUUID()}.${ext}`;
  await getMediaBucket().put(r2Key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });

  return NextResponse.json({ r2Key });
}

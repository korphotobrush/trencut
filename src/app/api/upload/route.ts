import { NextRequest, NextResponse } from "next/server";
import { getMediaBucket } from "@/lib/db";
import { getSession } from "@/lib/auth";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// 상품 이미지를 R2에 저장한다. 브라우저가 보낸 파일을 그대로 스트리밍하지 않고
// 서버가 검증(로그인/형식/용량) 후 저장하는데, 이미지 업로드는 OpenAI 호출과 달리
// 오래 걸리지 않아서 Worker가 잠깐 기다려도 비용에 큰 영향이 없다.
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: "이미지 파일(jpg/png/webp/gif)만 업로드할 수 있습니다." }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "파일이 너무 큽니다 (최대 10MB)." }, { status: 400 });

  const ext = file.type.split("/")[1];
  const r2Key = `uploads/${session.userId}/${crypto.randomUUID()}.${ext}`;
  await getMediaBucket().put(r2Key, await file.arrayBuffer());

  return NextResponse.json({ r2Key });
}

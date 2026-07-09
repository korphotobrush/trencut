import { NextRequest, NextResponse } from "next/server";
import { getMediaBucket } from "@/lib/db";

// 광고 배너 이미지처럼 방문자 브라우저가 로그인 없이 바로 불러와야 하는 R2 객체를
// 공개로 서빙한다. 사용자가 올린 상품 사진(uploads/{userId}/...)은 로그인 세션 없이도
// 누구나 URL만 알면 볼 수 있게 되면 안 되므로, 이 라우트는 "ads/"로 시작하는 키만
// 서빙하도록 제한한다 (광고 배너 업로드는 /api/admin/upload-banner에서 이 접두사로 저장).
export async function GET(req: NextRequest, context: { params: Promise<{ key: string[] }> }) {
  const { key } = await context.params;
  const r2Key = key.join("/");
  if (!r2Key.startsWith("ads/"))
    return NextResponse.json({ error: "접근할 수 없는 리소스입니다." }, { status: 403 });

  const obj = await getMediaBucket().get(r2Key);
  if (!obj) return NextResponse.json({ error: "이미지를 찾을 수 없습니다." }, { status: 404 });

  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

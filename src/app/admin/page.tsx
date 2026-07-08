// admin/page.tsx는 edge runtime 사용 불가 (OpenNext 제약)
// 세션 체크는 클라이언트 사이드에서 API 호출로 처리
import AdminClient from "./AdminClient";

export default function AdminPage() {
  return <AdminClient />;
}

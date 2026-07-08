// 관리자 화이트리스트 - 이 이메일로 로그인한 사람만 /admin 및 관리자 전용 API 접근 가능
// 관리자를 늘리려면 이 배열에 이메일만 추가하면 됨
const ADMIN_EMAILS = ["korphotobrush@gmail.com"];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

import "./globals.css";

export const metadata = {
  title: "트랜컷",
  description: "키워드 검색부터 AI 상세페이지 생성까지",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

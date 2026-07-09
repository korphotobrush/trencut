export const metadata = { title: "이용약관 | 트랜컷" };

export default function TermsPage() {
  return (
    <div style={wrapStyle}>
      <a href="/" style={backLinkStyle}>
        ← 트랜컷으로 돌아가기
      </a>
      <h1 style={h1Style}>이용약관</h1>
      <p style={metaStyle}>시행일자: 2026년 7월 9일</p>

      <Section title="1. 서비스 개요">
        <p style={pStyle}>
          트랜컷(이하 "서비스")은 이용자가 본인의 API 키를 등록하여 키워드 검색, 상품 이미지
          기반 AI 프롬프트 추천 등을 이용할 수 있는 도구입니다.
        </p>
      </Section>

      <Section title="2. 이용자의 책임">
        <ul style={ulStyle}>
          <li>업로드하는 이미지에 대한 저작권 등 권리는 이용자 본인에게 있어야 합니다.</li>
          <li>등록한 외부 API 키의 요금·한도는 각 API 제공사(OpenAI, Google, 네이버 등) 정책을 따르며, 서비스는 이에 대해 책임지지 않습니다.</li>
          <li>AI가 생성한 결과물은 오류를 포함할 수 있으므로, 실제 사용 전 반드시 검토해야 합니다.</li>
          <li>서비스를 무단 스크래핑, API 남용 등 부정한 목적으로 사용할 수 없습니다.</li>
        </ul>
      </Section>

      <Section title="3. 서비스의 제공 및 변경">
        <p style={pStyle}>
          서비스는 예고 없이 기능이 변경되거나 중단될 수 있으며, 안정적인 운영을 위해 노력하지만
          가용성·정확성을 보증하지 않습니다.
        </p>
      </Section>

      <Section title="4. 면책조항">
        <p style={pStyle}>
          서비스는 현재 상태("as is")로 제공되며, 서비스 이용으로 발생한 손해에 대해 법령이
          허용하는 범위 내에서 책임을 지지 않습니다.
        </p>
      </Section>

      <Section title="5. 문의처">
        <p style={pStyle}>이메일: korphotobrush@gmail.com</p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 26 }}>
      <h2 style={h2Style}>{title}</h2>
      {children}
    </div>
  );
}

const wrapStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "50px 24px 100px",
  color: "var(--ink)",
};
const backLinkStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--green-700)",
  textDecoration: "none",
};
const h1Style: React.CSSProperties = {
  fontSize: 24,
  color: "var(--green-900)",
  margin: "18px 0 4px",
};
const h2Style: React.CSSProperties = {
  fontSize: 16,
  color: "var(--green-900)",
  margin: "0 0 10px",
};
const metaStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--ink-soft)",
  margin: "0 0 24px",
};
const pStyle: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.8,
  color: "var(--ink)",
  margin: "0 0 8px",
};
const ulStyle: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.9,
  color: "var(--ink)",
  paddingLeft: 20,
  margin: 0,
};

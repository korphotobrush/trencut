export const metadata = { title: "개인정보처리방침 | 트랜컷" };

export default function PrivacyPage() {
  return (
    <div style={wrapStyle}>
      <a href="/" style={backLinkStyle}>
        ← 트랜컷으로 돌아가기
      </a>
      <h1 style={h1Style}>개인정보처리방침</h1>
      <p style={metaStyle}>시행일자: 2026년 7월 9일</p>

      <p style={pStyle}>
        트랜컷(이하 "서비스")은 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등
        관련 법령을 준수합니다. 본 방침은 서비스가 어떤 정보를 수집·이용·보관하는지 안내합니다.
      </p>

      <Section title="1. 수집하는 개인정보 항목">
        <ul style={ulStyle}>
          <li>Google 소셜 로그인 시: 이메일 주소, 프로필 정보(이름, 프로필 이미지)</li>
          <li>이용자가 직접 등록하는 외부 API 키(OpenAI, Google Gemini, 네이버 오픈API/검색광고API) — 암호화하여 저장</li>
          <li>이용자가 업로드하는 상품 이미지 — 본인 계정에 종속되어 저장, 타인에게 공개되지 않음</li>
          <li>서비스 이용 기록(키워드 검색 횟수, 생성 요청 횟수 등 사용량 제한 확인용)</li>
        </ul>
      </Section>

      <Section title="2. 개인정보의 수집 및 이용 목적">
        <ul style={ulStyle}>
          <li>회원 식별 및 로그인 유지</li>
          <li>이용자가 등록한 API 키로 본인 요청을 대신 처리(키워드 검색, AI 프롬프트 추천)</li>
          <li>일일 이용 한도 관리 및 서비스 부정 이용 방지</li>
          <li>서비스 품질 개선</li>
        </ul>
      </Section>

      <Section title="3. 개인정보의 보유 및 이용 기간">
        <p style={pStyle}>
          회원 탈퇴 또는 계정 삭제 요청 시 지체 없이 파기합니다. 단, 관련 법령에 따라 보존이
          필요한 경우 해당 기간 동안 보관합니다. 네이버 키워드 검색 결과는 중복 API 호출을
          줄이기 위해 최대 6시간만 캐시된 뒤 자동 만료됩니다.
        </p>
      </Section>

      <Section title="4. 개인정보의 제3자 제공">
        <p style={pStyle}>
          서비스는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 아래의 경우는
          예외로 합니다.
        </p>
        <ul style={ulStyle}>
          <li>
            이용자가 직접 등록한 API 키를 이용해 이용자 본인의 요청을 <strong>OpenAI, Google
            Gemini, 네이버</strong>에 전달하는 경우 (이 경우 각 사의 개인정보처리방침이 함께
            적용됩니다)
          </li>
          <li>법령에 근거하거나 수사기관의 적법한 요청이 있는 경우</li>
        </ul>
      </Section>

      <Section title="5. 광고 서비스 및 쿠키">
        <p style={pStyle}>
          서비스는 카카오 AdFit 광고를 게재하며, 광고 게재 과정에서 카카오 및 제휴사가 쿠키·광고
          식별자 등을 통해 정보를 수집할 수 있습니다. 이는 트랜컷이 직접 수집하는 정보가 아니며,
          자세한 내용은{" "}
          <a href="https://www.kakao.com/policy/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>
            카카오 개인정보처리방침
          </a>
          을 참고해주세요. 브라우저 설정에서 쿠키 저장을 거부할 수 있습니다.
        </p>
      </Section>

      <Section title="6. 이용자의 권리">
        <p style={pStyle}>
          이용자는 언제든지 본인의 개인정보 조회, 등록된 API 키 삭제, 계정 탈퇴를 요청할 수
          있습니다. 등록된 API 키는 "API 키 설정" 화면에서 직접 삭제할 수 있습니다.
        </p>
      </Section>

      <Section title="7. 개인정보의 안전성 확보 조치">
        <p style={pStyle}>
          등록된 API 키는 암호화되어 저장되며, 본인 요청 처리 목적 외에는 사용되지 않습니다.
          업로드된 이미지는 계정별로 분리 저장되어 타 이용자가 접근할 수 없습니다.
        </p>
      </Section>

      <Section title="8. 문의처">
        <p style={pStyle}>
          개인정보 관련 문의는 아래 이메일로 연락해주세요.
          <br />
          이메일: korphotobrush@gmail.com
        </p>
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
const linkStyle: React.CSSProperties = {
  color: "var(--green-700)",
  fontWeight: 600,
};

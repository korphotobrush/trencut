"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "@/lib/auth-client";
import ApiKeysModal from "./ApiKeysModal";
import KeywordSearchCard from "./KeywordSearchCard";
import ImageUploadBox, { UploadedImage } from "./ImageUploadBox";
import PromptSuggestCard from "./PromptSuggestCard";
import KakaoAdFit from "./KakaoAdFit";
import SidebarBanners from "./SidebarBanners";

export default function Home() {
  const { data: session } = useSession(); // 로그인 상태 (없으면 null)
  const [guideOpen, setGuideOpen] = useState(false);
  const [keysOpen, setKeysOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // 로그인한 계정이 관리자 화이트리스트(src/lib/admin.ts)에 있으면 네비게이션에
  // "관리자 페이지" 버튼을 노출한다. /admin URL을 직접 입력하지 않아도 되게 하기 위함.
  useEffect(() => {
    if (!session) {
      setIsAdmin(false);
      return;
    }
    fetch("/api/admin/check")
      .then((r) => r.json() as Promise<{ ok: boolean }>)
      .then((data) => setIsAdmin(data.ok))
      .catch(() => setIsAdmin(false));
  }, [session]);

  return (
    <>
      <div className="nav" style={navStyle}>
        <div style={logoStyle}>
          <span style={logoMarkStyle}>AI</span> 트랜컷
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setGuideOpen(true)} style={btnGuideStyle}>
            사용법 / API 가이드
          </button>
          <button onClick={() => setKeysOpen(true)} style={btnGhostStyle}>
            API 키 설정
          </button>
          {isAdmin && (
            <a href="/admin" style={{ ...btnGhostStyle, textDecoration: "none", display: "inline-block" }}>
              관리자 페이지
            </a>
          )}
          {session ? (
            // 로그인된 상태: 이메일 표시 + 로그아웃 버튼
            <button onClick={() => signOut()} style={btnSolidStyle}>
              {session.user.email} · 로그아웃
            </button>
          ) : (
            // 미로그인 상태: 누르면 구글 로그인 화면으로 이동
            <button
              onClick={() => signIn.social({ provider: "google", callbackURL: "/" })}
              style={btnSolidStyle}
            >
              로그인
            </button>
          )}
        </div>
      </div>

      <div style={floatingAdLeftStyle}>
        <KakaoAdFit adUnit="DAN-aLElIinBaSMcrQRx" width={160} height={600} />
      </div>

      <div style={shellStyle}>
        <div style={{ flex: 1, maxWidth: 736, minWidth: 0, paddingBottom: 60 }}>
          <div style={{ height: 24 }} />

          {/* 키워드 검색 (src/app/KeywordSearchCard.tsx: 실제 네이버 API 호출 + 결과 표시까지 포함) */}
          <KeywordSearchCard />

          {/* 이미지 업로드 */}
          <div style={cardStyle}>
            <p style={cardTitleStyle}>이미지 업로드</p>
            <p style={cardDescStyle}>
              본인이 확보한 상품 이미지만 업로드해 주세요. 최대 5장까지, 다 채우지 않아도 됩니다.
            </p>
            <ImageUploadBox onChange={setUploadedImages} />
          </div>

          {/* 프롬프트 추천 */}
          <PromptSuggestCard images={uploadedImages} />

          {/* 하단 AdFit */}
          <p style={{ fontSize: 11, color: "var(--ink-soft)", margin: "6px 0 8px" }}>
            AdFit (우선 3개)
          </p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={adfitSlotStyle}>
              <KakaoAdFit adUnit="DAN-iXRB31SLEUDw9fJg" width={728} height={90} />
            </div>
            <div style={adfitSlotStyle}>
              <KakaoAdFit adUnit="DAN-axuXgRvotGuf11Vz" width={728} height={90} />
            </div>
            <div style={adfitSlotStyle}>
              <KakaoAdFit adUnit="DAN-AcF3o33iAhb2UhgM" width={728} height={90} />
            </div>
          </div>

          <div style={footerStyle}>
            <h2 style={footerHeadStyle}>Policy &amp; Important Notices</h2>
            <div style={policyGridStyle}>
              <div style={policyBlockStyle}>
                <h3 style={policyHeadStyle}>Data collection</h3>
                <p style={policyPStyle}>This tool does not scrape or collect data on your behalf.</p>
                <p style={policyPStyle}>All keyword data is retrieved only through your own API credentials.</p>
                <p style={policyPStyle}>We do not sell or share your data with any third party.</p>
              </div>
              <div style={policyBlockStyle}>
                <h3 style={policyHeadStyle}>Your API keys</h3>
                <p style={policyPStyle}>Keys are encrypted at rest and used only for your own requests.</p>
                <p style={policyPStyle}>You may delete any stored key at any time.</p>
                <p style={policyPStyle}>We are not responsible for third-party provider charges or limits.</p>
              </div>
              <div style={policyBlockStyle}>
                <h3 style={policyHeadStyle}>Image &amp; content rights</h3>
                <p style={policyPStyle}>You are solely responsible for image and content rights.</p>
                <p style={policyPStyle}>This tool does not verify ownership.</p>
                <p style={policyPStyle}>Do not upload copyrighted material without permission.</p>
              </div>
              <div style={policyBlockStyle}>
                <h3 style={policyHeadStyle}>AI-generated output</h3>
                <p style={policyPStyle}>Generated copy may contain errors or unintended phrasing.</p>
                <p style={policyPStyle}>Review all output before publishing to any storefront.</p>
              </div>
              <div style={policyBlockStyle}>
                <h3 style={policyHeadStyle}>No warranty</h3>
                <p style={policyPStyle}>This tool is provided as is, without warranty of any kind.</p>
                <p style={policyPStyle}>We do not guarantee uptime, accuracy, or fitness for purpose.</p>
              </div>
              <div style={policyBlockStyle}>
                <h3 style={policyHeadStyle}>Prohibited use</h3>
                <p style={policyPStyle}>Do not use this tool for unauthorized scraping or API abuse.</p>
                <p style={policyPStyle}>Do not generate misleading or infringing listings.</p>
              </div>
            </div>
            <div style={footerBottomStyle}>
              트랜컷 v1.0.1 · All trademarks belong to their respective owners.
              <br />
              <a href="/privacy" style={{ color: "#c7d6cc" }}>개인정보처리방침</a>
              {" · "}
              <a href="/terms" style={{ color: "#c7d6cc" }}>이용약관</a>
            </div>
          </div>
        </div>

        {/* 우측 배너 — /admin에서 등록/활성화한 배너를 그대로 불러온다 (DB의 ad_banners, slot_group='sidebar') */}
        <div style={adColStyle}>
          <p style={{ fontSize: 11, color: "transparent", marginBottom: 2 }}>
            개인 광고 배너
          </p>
          <SidebarBanners />
        </div>
      </div>

      {keysOpen && <ApiKeysModal onClose={() => setKeysOpen(false)} />}

      {guideOpen && (
        <div style={modalOverlayStyle} onClick={() => setGuideOpen(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
              <h2 style={{ fontSize: 19, color: "var(--green-900)", margin: 0 }}>
                API 사용법 가이드
              </h2>
              <button onClick={() => setGuideOpen(false)} style={modalCloseStyle}>
                ×
              </button>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 16 }}>
              요즘 뜨는 키워드를 찾고, 상품 이미지를 올리면 AI가 이미지 생성 프롬프트를
              추천해줘요. 필드를 다듬어서 복사한 뒤 ChatGPT 등 외부 도구로 가져가 최종
              이미지를 만드세요. 개인 API 키로 동작해요.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={guideItemStyle}>
                <p style={guideItemTitleStyle}>Google Gemini API 키 (무료)</p>
                <p style={guideItemDescStyle}>
                  이미지 생성 프롬프트 추천에 사용됩니다. 결제 수단 등록 없이 무료로 발급받을 수
                  있어요 (일일/분당 요청 한도 있음). Gemini 키가 등록돼 있으면 OpenAI보다
                  우선 사용됩니다.
                </p>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={guideLinkStyle}
                >
                  Gemini API 키 무료로 발급받으러 가기 →
                </a>
              </div>
              <div style={guideItemStyle}>
                <p style={guideItemTitleStyle}>OpenAI API 키 (유료)</p>
                <p style={guideItemDescStyle}>
                  Gemini 키가 등록돼 있지 않을 때 대신 사용됩니다. 결제 수단 등록 후 키를
                  만들 수 있어요. 생성된 키는 그 자리에서만 보이니 바로 복사해두세요.
                </p>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={guideLinkStyle}
                >
                  OpenAI API 키 발급받으러 가기 →
                </a>
              </div>
              <div style={guideItemStyle}>
                <p style={guideItemTitleStyle}>네이버 오픈API (개인용) — 검색량 추이/요일·성별·연령대 분포</p>
                <ol style={guideStepsStyle}>
                  <li>위 링크에서 네이버 아이디로 로그인 후 애플리케이션 등록 화면으로 이동</li>
                  <li>애플리케이션 이름은 아무거나 입력 (예: 트랜컷)</li>
                  <li>
                    <strong>"사용 API" 목록에서 아래 3개를 전부 체크</strong> — 하나라도 빠지면
                    해당 기능만 "인증에 실패했습니다(errorCode 024)" 에러가 나요:
                    <ul style={guideSubListStyle}>
                      <li>데이터랩(검색어트렌드) — 검색량 추이·요일·성별·연령대 분포용</li>
                      <li>검색 → 블로그 — 블로그 총 발행량용</li>
                      <li>검색 → 카페글 — 카페 총 발행량용</li>
                    </ul>
                  </li>
                  <li>비로그인 오픈 API 서비스 환경은 "WEB 설정"에 아무 웹 주소나 등록 (예: 이 사이트 주소)</li>
                  <li>등록 완료하면 Client ID / Client Secret 바로 발급됨</li>
                </ol>
                <a
                  href="https://developers.naver.com/apps/#/register"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={guideLinkStyle}
                >
                  네이버 오픈API 신청하러 가기 →
                </a>
              </div>
              <div style={guideItemStyle}>
                <p style={guideItemTitleStyle}>네이버 검색광고 API (사업자용) — 연관키워드·검색량 표</p>
                <ol style={guideStepsStyle}>
                  <li>위 링크에서 네이버 검색광고 계정(사업자 등록 필요)으로 로그인</li>
                  <li>우측 상단 "도구" 메뉴 → "API 사용 관리" 클릭</li>
                  <li>"네이버 검색광고 API 서비스 신청" 버튼 클릭 (별도 심사 없이 바로 발급)</li>
                  <li>발급된 CUSTOMER_ID / 액세스라이선스 / 비밀키 3개를 그대로 복사</li>
                </ol>
                <a
                  href="https://searchad.naver.com/my-screen"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={guideLinkStyle}
                >
                  네이버 검색광고 API 신청하러 가기 →
                </a>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 18 }}>
              발급받은 키는 상단 "API 키 설정"에서 등록하면 됩니다. 키는 암호화되어
              저장되고, 본인 요청에만 사용됩니다. 오픈API/검색광고API 둘 다 등록해두면
              키워드 검색 결과에 표+그래프+분포가 한 번에 다 나와요.
            </p>
            <p style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 8 }}>
              참고: "검색어 이슈성 등급"이나 정확한 CPC 단가(원) 같은 일부 상용 키워드 툴의
              지표는 네이버가 공식 API로 제공하지 않아서 이 앱에서도 만들 수 없어요.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

const navStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "22px 30px",
  borderBottom: "1px solid var(--cream-2)",
};
const logoStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontWeight: 700,
  fontSize: 19,
  color: "var(--green-900)",
};
const logoMarkStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 3,
  background: "var(--green-500)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontSize: 13,
  fontWeight: 700,
};
const btnStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 3,
  padding: "10px 20px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};
const btnGhostStyle: React.CSSProperties = {
  ...btnStyle,
  background: "transparent",
  color: "var(--green-700)",
  border: "1.5px solid var(--green-300)",
};
const btnSolidStyle: React.CSSProperties = {
  ...btnStyle,
  background: "var(--green-700)",
  color: "#fff",
};
const btnGuideStyle: React.CSSProperties = {
  ...btnStyle,
  background: "var(--white)",
  color: "var(--green-700)",
  border: "1.5px solid var(--green-500)",
  fontSize: 13,
  padding: "9px 16px",
};
const floatingAdLeftStyle: React.CSSProperties = {
  position: "fixed",
  left: 70,
  top: "50%",
  transform: "translateY(-50%)",
  width: 160,
  height: 600,
  borderRadius: 3,
  zIndex: 40,
};
const shellStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  gap: 26,
  padding: "0 30px",
  maxWidth: 1180,
  margin: "0 auto",
};
const cardStyle: React.CSSProperties = {
  background: "var(--white)",
  borderRadius: 3,
  padding: 24,
  marginBottom: 18,
  border: "1px solid var(--cream-2)",
};
const cardTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: "var(--green-900)",
  margin: "0 0 4px",
};
const cardDescStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--ink-soft)",
  margin: "0 0 16px",
};
const adfitSlotStyle: React.CSSProperties = {
  width: 728,
  maxWidth: "100%",
  height: 90,
  overflowX: "auto",
  borderRadius: 3,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  color: "var(--ink-soft)",
  background: "var(--cream)",
};
const adColStyle: React.CSSProperties = {
  width: 180,
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  position: "sticky",
  top: 24,
};
const guideItemStyle: React.CSSProperties = {
  background: "var(--cream)",
  border: "1px solid var(--cream-2)",
  borderRadius: 3,
  padding: "14px 16px",
};
const guideItemTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "var(--green-900)",
  margin: "0 0 4px",
};
const guideItemDescStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--ink-soft)",
  lineHeight: 1.6,
  margin: "0 0 8px",
};
const guideLinkStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--green-700)",
  textDecoration: "none",
};
const guideStepsStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--ink-soft)",
  lineHeight: 1.7,
  margin: "0 0 8px",
  paddingLeft: 18,
};
const guideSubListStyle: React.CSSProperties = {
  margin: "4px 0",
  paddingLeft: 18,
  color: "var(--ink)",
};
const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(13,42,31,0.55)",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: "60px 20px",
  zIndex: 100,
  overflowY: "auto",
};
const modalBoxStyle: React.CSSProperties = {
  background: "var(--white)",
  borderRadius: 3,
  maxWidth: 640,
  width: "100%",
  padding: 32,
  border: "1px solid var(--cream-2)",
};
const modalCloseStyle: React.CSSProperties = {
  background: "var(--cream)",
  border: "1px solid var(--cream-2)",
  borderRadius: 3,
  width: 30,
  height: 30,
  cursor: "pointer",
  color: "var(--ink-soft)",
};
const footerStyle: React.CSSProperties = {
  marginTop: 10,
  background: "var(--green-900)",
  color: "var(--cream)",
  borderRadius: 3,
  padding: "28px 28px 20px",
};
const footerHeadStyle: React.CSSProperties = {
  fontSize: 13,
  letterSpacing: "0.06em",
  color: "var(--green-300)",
  margin: "0 0 16px",
  textTransform: "uppercase",
  textAlign: "center",
};
const policyGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 20,
  marginBottom: 18,
};
const policyBlockStyle: React.CSSProperties = {
  textAlign: "center",
};
const policyHeadStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--white)",
  margin: "0 0 6px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
const policyPStyle: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.65,
  color: "#c7d6cc",
  margin: "0 0 2px",
};
const footerBottomStyle: React.CSSProperties = {
  borderTop: "1px solid rgba(255,255,255,0.15)",
  paddingTop: 14,
  fontSize: 11,
  color: "#8ea597",
  lineHeight: 1.6,
  textAlign: "center",
};

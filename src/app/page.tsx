"use client";

import { useState } from "react";
import { generateDetailPageText, saveProjectResult } from "@/lib/client-generate";
import { useSession, signIn, signOut } from "@/lib/auth-client";
import ApiKeysModal from "./ApiKeysModal";
import KeywordSearchCard from "./KeywordSearchCard";
import ImageUploadBox from "./ImageUploadBox";

export default function Home() {
  const { data: session } = useSession(); // 로그인 상태 (없으면 null)
  const [guideOpen, setGuideOpen] = useState(false);
  const [keysOpen, setKeysOpen] = useState(false);
  const [uploadedImageKey, setUploadedImageKey] = useState<string | null>(null);
  const [mode, setMode] = useState<"auto" | "advanced">("auto");
  const [format, setFormat] = useState<"card" | "text" | "both">("card");
  const [advancedText, setAdvancedText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [resultText, setResultText] = useState("");
  const [genError, setGenError] = useState("");

  async function handleGenerate() {
    setGenerating(true);
    setGenError("");
    try {
      // TODO: 실제로는 업로드된 이미지를 Vision으로 먼저 설명 텍스트화하는 단계가 필요.
      // 지금은 데모용으로 고정 설명을 사용.
      const text = await generateDetailPageText({
        imageDescription: "여름용 린넨 원피스, 밝은 베이지 톤, 캐주얼한 데일리룩",
        advancedPrompt: mode === "advanced" ? advancedText : undefined,
        onChunk: setResultText,
      });
      setResultText(text);
      // 프로젝트가 이미 생성되어 있다면 결과 저장 (여기서는 데모이므로 생략 가능)
      // await saveProjectResult(projectId, text);
    } catch (e: any) {
      setGenError(e.message ?? "생성 중 오류가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  }

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

      <div style={floatingAdLeftStyle}>FLOATING AD</div>

      <div style={shellStyle}>
        <div style={{ flex: 1, maxWidth: 720, minWidth: 0, paddingBottom: 60 }}>
          <div style={{ height: 24 }} />

          {/* 키워드 검색 (src/app/KeywordSearchCard.tsx: 실제 네이버 API 호출 + 결과 표시까지 포함) */}
          <KeywordSearchCard />

          {/* 업로드 + 프롬프트 */}
          <div style={cardStyle}>
            <p style={cardTitleStyle}>이미지 업로드 & 프롬프트</p>
            <p style={cardDescStyle}>본인이 확보한 이미지만 업로드해 주세요.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <ImageUploadBox onUploaded={setUploadedImageKey} />
              <div>
                <div style={modeToggleStyle}>
                  <div onClick={() => setMode("auto")} style={modeOptStyle(mode === "auto")}>
                    자동 모드
                  </div>
                  <div
                    onClick={() => setMode("advanced")}
                    style={modeOptStyle(mode === "advanced")}
                  >
                    어드밴스드
                  </div>
                </div>
                <textarea
                  style={textareaStyle}
                  placeholder="예: 20대 여성 타겟 톤으로, 가격 강조 문구 빼줘"
                  value={advancedText}
                  onChange={(e) => setAdvancedText(e.target.value)}
                  disabled={mode !== "advanced"}
                />
              </div>
            </div>
          </div>

          {/* 출력 포맷 */}
          <div style={cardStyle}>
            <p style={cardTitleStyle}>출력 포맷 선택</p>
            <p style={cardDescStyle}>카드이미지, 텍스트블록, 또는 둘 다 받아보세요.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <div onClick={() => setFormat("card")} style={fmtOptStyle(format === "card")}>
                카드이미지
              </div>
              <div onClick={() => setFormat("text")} style={fmtOptStyle(format === "text")}>
                텍스트블록
              </div>
              <div onClick={() => setFormat("both")} style={fmtOptStyle(format === "both")}>
                둘 다
              </div>
            </div>
          </div>

          {/* 생성 + 결과 */}
          <div style={cardStyle}>
            <p style={cardTitleStyle}>생성하기</p>
            <p style={cardDescStyle}>
              등록된 OpenAI 키로 서버(/api/generate)가 스트리밍 프록시로 호출합니다.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{ ...btnStyle, background: "var(--green-500)", color: "#fff" }}
            >
              {generating ? "생성 중..." : "상세페이지 생성"}
            </button>
            {genError && (
              <p style={{ color: "var(--cta)", fontSize: 13, marginTop: 10 }}>{genError}</p>
            )}
            {resultText && (
              <div
                style={{
                  marginTop: 14,
                  background: "var(--cream)",
                  border: "1px solid var(--cream-2)",
                  borderRadius: 3,
                  padding: 16,
                  fontSize: 13,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.7,
                }}
              >
                {resultText}
              </div>
            )}
          </div>

          {/* 하단 AdFit */}
          <p style={{ fontSize: 11, color: "var(--ink-soft)", margin: "6px 0 8px" }}>
            AdFit (우선 3개)
          </p>
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <div style={adfitSlotStyle}>AdFit #1</div>
            <div style={adfitSlotStyle}>AdFit #2</div>
            <div style={adfitSlotStyle}>AdFit #3</div>
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
              This is a sandbox prototype for internal testing.
              <br />
              Not a final production build. All trademarks belong to their respective owners.
            </div>
          </div>
        </div>

        {/* 우측 배너 (DB의 ad_banners, slot_group='sidebar') */}
        <div style={adColStyle}>
          <p style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 2 }}>
            개인 광고 배너
          </p>
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} style={adSlotStyle} />
          ))}
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
              키워드부터 상세페이지까지, 업로드만 하면 AI가 완성해요. 요즘 뜨는
              키워드를 찾고 이미지를 올리면 한글화된 상세페이지로 재구성됩니다.
              개인 API 키로 동작해요.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={guideItemStyle}>
                <p style={guideItemTitleStyle}>OpenAI API 키</p>
                <p style={guideItemDescStyle}>
                  상세페이지 문구 생성에 사용됩니다. 결제 수단 등록 후 키를 만들 수 있어요.
                  생성된 키는 그 자리에서만 보이니 바로 복사해두세요.
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
                <p style={guideItemTitleStyle}>네이버 오픈API (개인용)</p>
                <p style={guideItemDescStyle}>
                  네이버 아이디로 로그인 후 애플리케이션을 등록하면 Client ID/Secret이
                  바로 발급됩니다. 키워드 검색(오픈API 소스)에 사용돼요.
                </p>
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
                <p style={guideItemTitleStyle}>네이버 검색광고 API (사업자용)</p>
                <p style={guideItemDescStyle}>
                  네이버 검색광고 계정으로 로그인 후 "도구 → API 사용 관리"에서
                  신청하면 CUSTOMER_ID/액세스라이선스/비밀키가 발급됩니다.
                </p>
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
              저장되고, 본인 요청에만 사용됩니다.
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
  width: 90,
  height: 480,
  border: "1.5px dashed transparent",
  borderRadius: 3,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  writingMode: "vertical-rl",
  fontSize: 12,
  color: "var(--ink-soft)",
  background: "var(--cream)",
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
const modeToggleStyle: React.CSSProperties = {
  display: "flex",
  background: "var(--cream)",
  borderRadius: 3,
  padding: 4,
  marginBottom: 14,
  border: "1px solid var(--cream-2)",
};
const modeOptStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  textAlign: "center",
  padding: "9px 0",
  borderRadius: 3,
  fontSize: 13,
  fontWeight: 600,
  color: active ? "#fff" : "var(--ink-soft)",
  background: active ? "var(--green-700)" : "transparent",
  cursor: "pointer",
});
const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 74,
  border: "1.5px solid var(--cream-2)",
  borderRadius: 3,
  padding: "12px 14px",
  fontSize: 13,
  color: "var(--ink)",
  resize: "vertical",
  outline: "none",
  background: "var(--white)",
};
const fmtOptStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  border: `1.5px solid ${active ? "var(--green-500)" : "var(--cream-2)"}`,
  borderRadius: 3,
  padding: "14px 10px",
  textAlign: "center",
  cursor: "pointer",
  background: active ? "var(--green-100)" : "var(--cream)",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--green-900)",
});
const adfitSlotStyle: React.CSSProperties = {
  flex: 1,
  height: 90,
  border: "1.5px dashed transparent",
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
const adSlotStyle: React.CSSProperties = {
  height: 150,
  border: "1.5px dashed transparent",
  borderRadius: 3,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  color: "var(--ink-soft)",
  background: "var(--cream)",
  textAlign: "center",
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

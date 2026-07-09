"use client";

import { useEffect, useState } from "react";

// "API 키 설정" 버튼을 누르면 뜨는 팝업.
// 서버의 /api/keys(GET/POST/DELETE)를 호출해서 사용자 본인의 OpenAI/네이버 키를
// 등록/조회/삭제한다. 실제 키 값은 서버에서 암호화되어 D1에 저장된다 (src/lib/crypto.ts).

type ProviderId = "openai" | "gemini" | "naver_open" | "naver_searchad";

const PROVIDERS: { id: ProviderId; label: string }[] = [
  { id: "gemini", label: "Google Gemini (무료)" },
  { id: "openai", label: "OpenAI" },
  { id: "naver_open", label: "네이버 오픈API" },
  { id: "naver_searchad", label: "네이버 검색광고API" },
];

// provider마다 필요한 값 개수가 다르다: OpenAI/Gemini는 키 1개, 네이버 오픈API는 Client ID/Secret 2개,
// 검색광고API는 Customer ID/액세스라이선스/비밀키 3개. 여기서 입력받은 값들은
// (OpenAI/Gemini 제외) JSON 문자열로 합쳐져서 서버로 전송되고, 서버가 통째로 암호화해서 저장한다.
const PROVIDER_FIELDS: Record<ProviderId, { key: string; label: string; placeholder: string }[]> = {
  openai: [{ key: "value", label: "API 키", placeholder: "sk-..." }],
  gemini: [{ key: "value", label: "API 키", placeholder: "AIza..." }],
  naver_open: [
    { key: "clientId", label: "Client ID", placeholder: "네이버 오픈API Client ID" },
    { key: "clientSecret", label: "Client Secret", placeholder: "네이버 오픈API Client Secret" },
  ],
  naver_searchad: [
    { key: "customerId", label: "Customer ID", placeholder: "예: 1234567" },
    { key: "accessLicense", label: "액세스라이선스", placeholder: "API 사용 관리에서 발급된 값" },
    { key: "secretKey", label: "비밀키", placeholder: "API 사용 관리에서 발급된 값" },
  ],
};

type KeyRow = { id: string; provider: ProviderId; is_valid: number };

export default function ApiKeysModal({ onClose }: { onClose: () => void }) {
  const [keys, setKeys] = useState<KeyRow[] | null>(null); // null = 아직 로딩 중
  const [needsLogin, setNeedsLogin] = useState(false);
  const [provider, setProvider] = useState<ProviderId>("gemini");
  const [fields, setFields] = useState<Record<string, string>>({}); // 입력 중인 필드값들
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 팝업이 열릴 때 현재 등록된 키 목록을 가져온다.
  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    const res = await fetch("/api/keys");
    if (res.status === 401) {
      setNeedsLogin(true);
      setKeys([]);
      return;
    }
    const data = (await res.json()) as { keys: KeyRow[] };
    setKeys(data.keys);
  }

  async function handleSave() {
    const requiredFields = PROVIDER_FIELDS[provider];
    if (requiredFields.some((f) => !fields[f.key]?.trim())) return; // 빈 칸 있으면 저장 안 함
    // OpenAI/Gemini는 값이 하나라 그냥 문자열로, 나머지는 여러 값을 JSON으로 묶어서 보낸다.
    const value = provider === "openai" || provider === "gemini" ? fields.value : JSON.stringify(fields);
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, value }),
      });
      if (!res.ok) throw new Error("저장에 실패했습니다.");
      setFields({});
      await loadKeys();
    } catch (e: any) {
      setError(e.message ?? "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: ProviderId) {
    await fetch(`/api/keys?provider=${p}`, { method: "DELETE" });
    await loadKeys();
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={boxStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontSize: 19, color: "var(--green-900)", margin: 0 }}>API 키 설정</h2>
          <button onClick={onClose} style={closeBtnStyle}>×</button>
        </div>

        {needsLogin && (
          <p style={{ fontSize: 13, color: "var(--cta)" }}>
            먼저 로그인해야 API 키를 등록할 수 있습니다.
          </p>
        )}

        {!needsLogin && (
          <>
            {/* 등록된 키 목록 */}
            <div style={{ marginBottom: 20 }}>
              {keys && keys.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>등록된 키가 없습니다.</p>
              )}
              {keys?.map((k) => (
                <div key={k.id} style={rowStyle}>
                  <span>{PROVIDERS.find((p) => p.id === k.provider)?.label ?? k.provider}</span>
                  <button onClick={() => handleDelete(k.provider)} style={deleteBtnStyle}>
                    삭제
                  </button>
                </div>
              ))}
            </div>

            {/* 새 키 등록 폼: provider를 바꾸면 아래 입력칸 개수도 같이 바뀐다 */}
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value as ProviderId);
                setFields({}); // provider 바뀌면 입력하던 값 초기화
              }}
              style={{ ...selectStyle, width: "100%", marginBottom: 8 }}
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            {PROVIDER_FIELDS[provider].map((f) => (
              <input
                key={f.key}
                type="password"
                placeholder={f.label + " — " + f.placeholder}
                value={fields[f.key] ?? ""}
                onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                style={{ ...inputStyle, width: "100%", marginBottom: 8, boxSizing: "border-box" }}
              />
            ))}
            <button onClick={handleSave} disabled={saving} style={saveBtnStyle}>
              {saving ? "저장 중..." : "저장"}
            </button>
            {error && <p style={{ color: "var(--cta)", fontSize: 13 }}>{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
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
const boxStyle: React.CSSProperties = {
  background: "var(--white)",
  borderRadius: 3,
  maxWidth: 480,
  width: "100%",
  padding: 32,
  border: "1px solid var(--cream-2)",
};
const closeBtnStyle: React.CSSProperties = {
  background: "var(--cream)",
  border: "1px solid var(--cream-2)",
  borderRadius: 3,
  width: 30,
  height: 30,
  cursor: "pointer",
  color: "var(--ink-soft)",
};
const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 0",
  borderBottom: "1px solid var(--cream-2)",
  fontSize: 13,
};
const deleteBtnStyle: React.CSSProperties = {
  border: "1px solid var(--cream-2)",
  background: "transparent",
  color: "var(--ink-soft)",
  borderRadius: 3,
  padding: "4px 10px",
  fontSize: 12,
  cursor: "pointer",
};
const selectStyle: React.CSSProperties = {
  border: "1.5px solid var(--cream-2)",
  borderRadius: 3,
  padding: "10px 8px",
  fontSize: 13,
  background: "var(--cream)",
};
const inputStyle: React.CSSProperties = {
  flex: 1,
  border: "1.5px solid var(--cream-2)",
  borderRadius: 3,
  padding: "10px 12px",
  fontSize: 13,
  background: "var(--cream)",
};
const saveBtnStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 3,
  padding: "10px 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  background: "var(--green-500)",
  color: "#fff",
};

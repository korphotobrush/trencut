"use client";

import { useMemo, useState } from "react";
import { suggestPromptFields } from "@/lib/client-generate";
import { buildFinalPrompt, EMPTY_PROMPT_FIELDS, type PromptFields } from "@/lib/prompt-fields";
import type { UploadedImage } from "./ImageUploadBox";

// 이미지를 업로드하면 AI가 프롬프트 재료(제품명/장면/배경/디테일/조명/해시태그)를
// 추천하고, 사용자가 각 필드를 직접 고칠 수 있게 보여준다. 아래 최종 프롬프트는
// 필드가 바뀔 때마다 즉시 다시 조립되고, 복사하거나 ChatGPT로 바로 이동할 수 있다.
export default function PromptSuggestCard({ images }: { images: UploadedImage[] }) {
  const [fields, setFields] = useState<PromptFields>(EMPTY_PROMPT_FIELDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const finalPrompt = useMemo(() => buildFinalPrompt(fields), [fields]);

  async function handleSuggest() {
    if (images.length === 0) {
      setError("먼저 상품 이미지를 업로드해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await suggestPromptFields({
        images: images.map((img) => ({ base64: img.base64, mimeType: img.mimeType })),
      });
      setFields(result);
    } catch (e: any) {
      setError(e.message ?? "추천 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(finalPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleGoToChatGPT() {
    await navigator.clipboard.writeText(finalPrompt);
    window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer");
  }

  function updateListField(key: "details" | "lighting" | "hashtags", index: number, value: string) {
    setFields((prev) => {
      const list = [...prev[key]];
      list[index] = value;
      return { ...prev, [key]: list };
    });
  }
  function addListItem(key: "details" | "lighting" | "hashtags") {
    setFields((prev) => ({ ...prev, [key]: [...prev[key], ""] }));
  }
  function removeListItem(key: "details" | "lighting" | "hashtags", index: number) {
    setFields((prev) => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }));
  }

  const hasSuggestion = fields.productName || fields.scene || fields.details.length > 0;

  return (
    <div style={cardStyle}>
      <p style={cardTitleStyle}>프롬프트 추천</p>
      <p style={cardDescStyle}>
        업로드한 상품 사진을 보고 AI가 상세페이지용 프롬프트 재료를 제안합니다. 기본값은
        아이폰으로 찍은 듯한 사실적인 사진 스타일이에요. 필드를 직접 고친 뒤 최종 프롬프트를
        복사해서 ChatGPT 등 외부 이미지 생성 도구로 가져가세요.
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={handleSuggest} disabled={loading} style={btnStyle}>
          {loading ? "추천 중..." : hasSuggestion ? "다시 추천받기" : "프롬프트 추천받기"}
        </button>
        {loading && (
          <>
            <Spinner />
            <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>이미지를 분석하는 중입니다...</span>
          </>
        )}
      </div>
      {error && <p style={{ color: "var(--cta)", fontSize: 13, marginTop: 10 }}>{error}</p>}

      {hasSuggestion && (
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <FieldRow label="제품명">
            <input
              value={fields.productName}
              onChange={(e) => setFields((p) => ({ ...p, productName: e.target.value }))}
              style={inputStyle}
            />
          </FieldRow>
          <FieldRow label="장면">
            <textarea
              value={fields.scene}
              onChange={(e) => setFields((p) => ({ ...p, scene: e.target.value }))}
              style={textareaStyle}
            />
          </FieldRow>
          <FieldRow label="배경">
            <textarea
              value={fields.background}
              onChange={(e) => setFields((p) => ({ ...p, background: e.target.value }))}
              style={textareaStyle}
            />
          </FieldRow>
          <ListFieldRow
            label="유지할 디테일"
            items={fields.details}
            onChangeItem={(i, v) => updateListField("details", i, v)}
            onAdd={() => addListItem("details")}
            onRemove={(i) => removeListItem("details", i)}
          />
          <ListFieldRow
            label="조명"
            items={fields.lighting}
            onChangeItem={(i, v) => updateListField("lighting", i, v)}
            onAdd={() => addListItem("lighting")}
            onRemove={(i) => removeListItem("lighting", i)}
          />
          <ListFieldRow
            label="해시태그"
            items={fields.hashtags}
            onChangeItem={(i, v) => updateListField("hashtags", i, v)}
            onAdd={() => addListItem("hashtags")}
            onRemove={(i) => removeListItem("hashtags", i)}
          />

          <div>
            <p style={fieldLabelStyle}>최종 프롬프트</p>
            <textarea readOnly value={finalPrompt} style={finalPromptStyle} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleCopy} style={{ ...btnStyle, background: "var(--green-700)" }}>
              {copied ? "복사됨!" : "프롬프트 복사하기"}
            </button>
            <button onClick={handleGoToChatGPT} style={{ ...btnStyle, background: "var(--ink)" }}>
              복사하고 ChatGPT 열기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={fieldLabelStyle}>{label}</p>
      {children}
    </div>
  );
}

function ListFieldRow({
  label,
  items,
  onChangeItem,
  onAdd,
  onRemove,
}: {
  label: string;
  items: string[];
  onChangeItem: (i: number, v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div>
      <p style={fieldLabelStyle}>{label}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 6 }}>
            <input value={item} onChange={(e) => onChangeItem(i, e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={() => onRemove(i)} style={removeBtnStyle} title="삭제">
              ×
            </button>
          </div>
        ))}
        <button onClick={onAdd} style={addBtnStyle}>
          + 항목 추가
        </button>
      </div>
    </div>
  );
}

function Spinner() {
  return <div style={spinnerStyle} />;
}

const spinnerStyle: React.CSSProperties = {
  width: 16,
  height: 16,
  borderRadius: "50%",
  border: "2px solid var(--cream-2)",
  borderTopColor: "var(--green-500)",
  animation: "spin 0.7s linear infinite",
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
const btnStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 3,
  padding: "10px 18px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  background: "var(--green-500)",
  color: "#fff",
};
const fieldLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--green-900)",
  margin: "0 0 6px",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid var(--cream-2)",
  borderRadius: 3,
  padding: "9px 12px",
  fontSize: 13,
  background: "var(--cream)",
  boxSizing: "border-box",
};
const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 56,
  resize: "vertical",
  fontFamily: "inherit",
};
const finalPromptStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 220,
  resize: "vertical",
  fontFamily: "monospace",
  fontSize: 12,
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
};
const removeBtnStyle: React.CSSProperties = {
  border: "1px solid var(--cream-2)",
  background: "transparent",
  color: "var(--ink-soft)",
  borderRadius: 3,
  width: 34,
  fontSize: 14,
  cursor: "pointer",
};
const addBtnStyle: React.CSSProperties = {
  alignSelf: "flex-start",
  border: "1px dashed var(--green-300)",
  background: "transparent",
  color: "var(--green-700)",
  borderRadius: 3,
  padding: "6px 12px",
  fontSize: 12,
  cursor: "pointer",
};

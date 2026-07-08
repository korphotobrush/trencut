"use client";

import { useRef, useState } from "react";

// 클릭하거나 이미지를 끌어다 놓으면 업로드되는 박스.
// 미리보기는 서버 응답을 기다리지 않고 브라우저가 들고 있는 파일 그대로 바로 보여주고
// (URL.createObjectURL), 그 사이에 실제 파일은 /api/upload로 올려서 R2에 저장한다.
// 업로드가 끝나면 결과로 받은 r2Key를 onUploaded로 부모(page.tsx)에 알려준다.
export default function ImageUploadBox({ onUploaded }: { onUploaded?: (r2Key: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setPreview(URL.createObjectURL(file));
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = (await res.json()) as { r2Key?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "업로드에 실패했습니다.");
      onUploaded?.(data.r2Key!);
    } catch (e: any) {
      setError(e.message ?? "업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      style={uploadBoxStyle}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {preview ? (
        <img
          src={preview}
          alt="업로드 미리보기"
          style={{ maxWidth: "100%", maxHeight: 130, borderRadius: 3, objectFit: "contain" }}
        />
      ) : (
        <>
          <strong style={{ display: "block", color: "var(--green-700)", marginBottom: 4 }}>
            + 이미지 올리기
          </strong>
          드래그하거나 클릭해서 업로드
        </>
      )}
      {uploading && (
        <p style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 6 }}>업로드 중...</p>
      )}
      {error && <p style={{ fontSize: 11, color: "var(--cta)", marginTop: 6 }}>{error}</p>}
    </div>
  );
}

const uploadBoxStyle: React.CSSProperties = {
  border: "1.5px dashed var(--green-300)",
  borderRadius: 3,
  padding: "30px 16px",
  minHeight: 140,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  color: "var(--ink-soft)",
  fontSize: 13,
  background: "var(--cream)",
  cursor: "pointer",
};

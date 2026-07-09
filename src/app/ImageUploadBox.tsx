"use client";

import { useRef, useState } from "react";

export type UploadedImage = {
  r2Key: string;
  base64: string;
  mimeType: string;
};

const MAX_IMAGES = 5;

// 상품 사진을 최대 5장까지 업로드하는 박스. 5장을 다 채우지 않아도 있는 만큼만으로
// 프롬프트 추천을 받을 수 있다. 각 사진은 올리자마자 /api/upload로 R2에 저장하고,
// base64도 함께 들고 있다가 /api/generate(프롬프트 추천) 호출 시 그대로 실어 보낸다.
export default function ImageUploadBox({
  onChange,
}: {
  onChange?: (images: UploadedImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState("");

  function update(updater: (prev: UploadedImage[]) => UploadedImage[]) {
    setImages((prev) => {
      const next = updater(prev);
      onChange?.(next);
      return next;
    });
  }

  function readAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
      reader.onerror = () => reject(new Error("이미지를 읽지 못했습니다."));
      reader.readAsDataURL(file);
    });
  }

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files).slice(0, MAX_IMAGES - images.length);
    if (list.length === 0) return;
    setError("");
    setUploadingCount((n) => n + list.length);

    for (const file of list) {
      try {
        const [base64, uploadRes] = await Promise.all([
          readAsBase64(file),
          (async () => {
            const form = new FormData();
            form.append("file", file);
            return fetch("/api/upload", { method: "POST", body: form });
          })(),
        ]);
        const uploadData = (await uploadRes.json()) as { r2Key?: string; error?: string };
        if (!uploadRes.ok) throw new Error(uploadData.error ?? "업로드에 실패했습니다.");
        update((prev) => [...prev, { r2Key: uploadData.r2Key!, base64, mimeType: file.type }]);
      } catch (e: any) {
        setError(e.message ?? "업로드 중 오류가 발생했습니다.");
      } finally {
        setUploadingCount((n) => n - 1);
      }
    }
  }

  function handleRemove(r2Key: string) {
    update((prev) => prev.filter((img) => img.r2Key !== r2Key));
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {images.map((img) => (
          <div key={img.r2Key} style={thumbWrapStyle}>
            <img src={`data:${img.mimeType};base64,${img.base64}`} alt="상품 이미지" style={thumbImgStyle} />
            <button onClick={() => handleRemove(img.r2Key)} style={removeBtnStyle} title="삭제">
              ×
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <div
            style={addTileStyle}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files?.length) handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <strong style={{ color: "var(--green-700)" }}>+ 이미지 추가</strong>
            <span style={{ fontSize: 11, marginTop: 4 }}>
              {uploadingCount > 0 ? "업로드 중..." : `${images.length}/${MAX_IMAGES}장`}
            </span>
          </div>
        )}
      </div>
      {error && <p style={{ fontSize: 11, color: "var(--cta)", marginTop: 6 }}>{error}</p>}
    </div>
  );
}

const thumbWrapStyle: React.CSSProperties = {
  position: "relative",
  width: 96,
  height: 96,
  borderRadius: 3,
  overflow: "hidden",
  border: "1px solid var(--cream-2)",
  background: "var(--cream)",
};
const thumbImgStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};
const removeBtnStyle: React.CSSProperties = {
  position: "absolute",
  top: 2,
  right: 2,
  width: 20,
  height: 20,
  lineHeight: "18px",
  padding: 0,
  border: "none",
  borderRadius: "50%",
  background: "rgba(13,42,31,0.7)",
  color: "#fff",
  fontSize: 13,
  cursor: "pointer",
};
const addTileStyle: React.CSSProperties = {
  width: 96,
  height: 96,
  border: "1.5px dashed var(--green-300)",
  borderRadius: 3,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  color: "var(--ink-soft)",
  fontSize: 11,
  background: "var(--cream)",
  cursor: "pointer",
};

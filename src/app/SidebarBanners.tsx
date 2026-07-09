"use client";

import { useEffect, useState } from "react";

type Banner = { id: string; r2_key: string | null; link_url: string | null };

// 관리자 페이지(/admin)에서 등록/활성화한 개인 광고 배너를 그대로 불러와 보여준다.
// 이미지는 /api/media/[key](ads/ 접두사만 공개 서빙)로 불러온다.
export default function SidebarBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    fetch("/api/ad-banners?group=sidebar")
      .then((r) => r.json() as Promise<{ banners?: Banner[] }>)
      .then((data) => setBanners(data.banners ?? []))
      .catch(() => setBanners([]));
  }, []);

  if (banners.length === 0) {
    return <div style={adSlotStyle} />;
  }

  return (
    <>
      {banners.map((b) =>
        b.r2_key ? (
          <a key={b.id} href={b.link_url ?? undefined} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
            <img src={`/api/media/${b.r2_key}`} alt="" style={imgStyle} />
          </a>
        ) : null
      )}
    </>
  );
}

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
const imgStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 3,
  border: "1px solid var(--cream-2)",
};

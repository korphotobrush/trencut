"use client";

import { useEffect, useState } from "react";

type Banner = {
  id: string;
  r2_key: string | null;
  link_url: string | null;
  sort_order: number;
};

export default function AdminBannerList() {
  const [group, setGroup] = useState("sidebar");
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    fetch(`/api/ad-banners?group=${group}`)
      .then((r) => r.json() as Promise<{ banners?: Banner[] }>)
      .then((data) => setBanners(data.banners ?? []));
  }, [group]);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        {["sidebar", "bottom", "floating_left"].map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            style={{
              padding: "8px 16px",
              borderRadius: 3,
              border: g === group ? "1.5px solid var(--green-500)" : "1.5px solid var(--cream-2)",
              background: g === group ? "var(--green-100)" : "var(--cream)",
              cursor: "pointer",
            }}
          >
            {g}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {banners.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            이 그룹에 등록된 배너가 없습니다.
          </p>
        )}
        {banners.map((b) => (
          <div
            key={b.id}
            style={{
              background: "var(--white)",
              border: "1px solid var(--cream-2)",
              borderRadius: 3,
              padding: 16,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{b.r2_key ?? "이미지 없음"}</span>
            <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>{b.link_url}</span>
          </div>
        ))}
      </div>

      {/* TODO: 이미지 업로드(R2) + 신규 배너 추가 폼 */}
    </div>
  );
}

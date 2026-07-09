"use client";

import { useEffect, useState } from "react";

type Banner = {
  id: string;
  r2_key: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: number;
};

const GROUP_LABELS: Record<string, string> = {
  sidebar: "우측 사이드바 (세로형 배너)",
  bottom: "하단 배너",
  floating_left: "좌측 플로팅",
};
const GROUPS = ["sidebar", "bottom", "floating_left"];
const MIN_SLOTS = 5;

// slot_group='sidebar'는 실제 홈 화면 우측에 세로로 나열되는 배너다 (src/app/SidebarBanners.tsx).
// "배너 몇 개가 등록돼 있는지" 목록형 UI 대신, 항상 최소 5칸(+빈칸 1개 여유)을 슬롯처럼
// 보여줘서 몇 개가 비어있는지 한눈에 보이게 하고, 빈 슬롯을 클릭하면 바로 그 자리에 업로드한다.
export default function AdminBannerList() {
  const [group, setGroup] = useState("sidebar");
  const [banners, setBanners] = useState<Banner[]>([]);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    fetch(`/api/ad-banners?group=${group}`)
      .then((r) => r.json() as Promise<{ banners?: Banner[] }>)
      .then((data) => setBanners((data.banners ?? []).sort((a, b) => a.sort_order - b.sort_order)));
  }

  useEffect(load, [group]);

  function openSlot(slotIndex: number) {
    setUploadingSlot(slotIndex);
    setFile(null);
    setLinkUrl("");
    setError("");
  }

  async function handleAdd(slotIndex: number) {
    if (!file) {
      setError("배너 이미지를 선택해주세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const uploadRes = await fetch("/api/admin/upload-banner", { method: "POST", body: form });
      const uploadData = (await uploadRes.json()) as { r2Key?: string; error?: string };
      if (!uploadRes.ok) throw new Error(uploadData.error ?? "업로드에 실패했습니다.");

      const createRes = await fetch("/api/ad-banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotGroup: group,
          r2Key: uploadData.r2Key,
          linkUrl: linkUrl || undefined,
          sortOrder: slotIndex,
          isActive: true,
        }),
      });
      const createData = (await createRes.json()) as { error?: string };
      if (!createRes.ok) throw new Error(createData.error ?? "배너 등록에 실패했습니다.");

      setUploadingSlot(null);
      setFile(null);
      setLinkUrl("");
      load();
    } catch (e: any) {
      setError(e.message ?? "등록 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(b: Banner) {
    await fetch("/api/ad-banners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b.id, isActive: !b.is_active }),
    });
    load();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/ad-banners?id=${id}`, { method: "DELETE" });
    load();
  }

  const slotCount = Math.max(MIN_SLOTS, banners.length + 1);
  const slots: (Banner | null)[] = Array.from({ length: slotCount }, (_, i) => banners[i] ?? null);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, margin: "16px 0", flexWrap: "wrap" }}>
        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => {
              setGroup(g);
              setUploadingSlot(null);
            }}
            style={{
              padding: "8px 16px",
              borderRadius: 3,
              border: g === group ? "1.5px solid var(--green-500)" : "1.5px solid var(--cream-2)",
              background: g === group ? "var(--green-100)" : "var(--cream)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {GROUP_LABELS[g] ?? g}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {slots.map((banner, i) =>
          banner ? (
            <div key={banner.id} style={filledSlotStyle}>
              <span style={slotNumStyle}>{i + 1}</span>
              {banner.r2_key && (
                <img
                  src={`/api/media/${banner.r2_key}`}
                  alt=""
                  style={{ width: 90, height: 56, objectFit: "cover", borderRadius: 3, border: "1px solid var(--cream-2)" }}
                />
              )}
              <span style={{ color: "var(--ink-soft)", fontSize: 13, flex: 1 }}>{banner.link_url ?? "링크 없음"}</span>
              <button onClick={() => toggleActive(banner)} style={toggleBtnStyle(!!banner.is_active)}>
                {banner.is_active ? "노출 중" : "비활성"}
              </button>
              <button onClick={() => handleDelete(banner.id)} style={deleteBtnStyle}>
                삭제
              </button>
            </div>
          ) : uploadingSlot === i ? (
            <div key={`upload-${i}`} style={emptySlotStyle}>
              <span style={slotNumStyle}>{i + 1}</span>
              <div style={{ flex: 1 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  style={{ display: "block", marginBottom: 6, fontSize: 12 }}
                />
                <input
                  type="text"
                  placeholder="링크 URL (https://... , 선택)"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  style={linkInputStyle}
                />
              </div>
              <button onClick={() => handleAdd(i)} disabled={saving} style={addConfirmBtnStyle}>
                {saving ? "등록 중..." : "등록"}
              </button>
              <button onClick={() => setUploadingSlot(null)} style={deleteBtnStyle}>
                취소
              </button>
            </div>
          ) : (
            <div key={`empty-${i}`} style={emptySlotStyle} onClick={() => openSlot(i)}>
              <span style={slotNumStyle}>{i + 1}</span>
              <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>+ 배너 추가</span>
            </div>
          )
        )}
      </div>
      {error && <p style={{ color: "var(--cta)", fontSize: 12, marginTop: 10 }}>{error}</p>}
    </div>
  );
}

const filledSlotStyle: React.CSSProperties = {
  background: "var(--white)",
  border: "1px solid var(--cream-2)",
  borderRadius: 3,
  padding: 12,
  display: "flex",
  alignItems: "center",
  gap: 12,
};
const emptySlotStyle: React.CSSProperties = {
  background: "var(--cream)",
  border: "1.5px dashed var(--green-300)",
  borderRadius: 3,
  padding: 12,
  display: "flex",
  alignItems: "center",
  gap: 12,
  cursor: "pointer",
};
const slotNumStyle: React.CSSProperties = {
  width: 20,
  fontSize: 12,
  fontWeight: 700,
  color: "var(--green-700)",
  flexShrink: 0,
};
const linkInputStyle: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid var(--cream-2)",
  borderRadius: 3,
  padding: "7px 10px",
  fontSize: 12,
  boxSizing: "border-box",
};
const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: "6px 12px",
  borderRadius: 3,
  border: "1px solid var(--cream-2)",
  background: active ? "var(--green-100)" : "var(--cream)",
  color: active ? "var(--green-700)" : "var(--ink-soft)",
  fontSize: 12,
  cursor: "pointer",
});
const deleteBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 3,
  border: "1px solid var(--cream-2)",
  background: "transparent",
  color: "var(--cta)",
  fontSize: 12,
  cursor: "pointer",
};
const addConfirmBtnStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 3,
  border: "none",
  background: "var(--green-500)",
  color: "#fff",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

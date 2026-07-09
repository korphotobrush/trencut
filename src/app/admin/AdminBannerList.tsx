"use client";

import { useEffect, useState } from "react";

type Banner = {
  id: string;
  r2_key: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: number;
};

export default function AdminBannerList() {
  const [group, setGroup] = useState("sidebar");
  const [banners, setBanners] = useState<Banner[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    fetch(`/api/ad-banners?group=${group}`)
      .then((r) => r.json() as Promise<{ banners?: Banner[] }>)
      .then((data) => setBanners(data.banners ?? []));
  }

  useEffect(load, [group]);

  async function handleAdd() {
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
          isActive: true,
        }),
      });
      const createData = (await createRes.json()) as { error?: string };
      if (!createRes.ok) throw new Error(createData.error ?? "배너 등록에 실패했습니다.");

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

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
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
              padding: 12,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            {b.r2_key && (
              <img
                src={`/api/media/${b.r2_key}`}
                alt=""
                style={{ width: 80, height: 50, objectFit: "cover", borderRadius: 3, border: "1px solid var(--cream-2)" }}
              />
            )}
            <span style={{ color: "var(--ink-soft)", fontSize: 13, flex: 1 }}>{b.link_url ?? "링크 없음"}</span>
            <button
              onClick={() => toggleActive(b)}
              style={{
                padding: "6px 12px",
                borderRadius: 3,
                border: "1px solid var(--cream-2)",
                background: b.is_active ? "var(--green-100)" : "var(--cream)",
                color: b.is_active ? "var(--green-700)" : "var(--ink-soft)",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {b.is_active ? "노출 중" : "비활성"}
            </button>
            <button
              onClick={() => handleDelete(b.id)}
              style={{
                padding: "6px 12px",
                borderRadius: 3,
                border: "1px solid var(--cream-2)",
                background: "transparent",
                color: "var(--cta)",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              삭제
            </button>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--cream)", border: "1px solid var(--cream-2)", borderRadius: 3, padding: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--green-900)", margin: "0 0 10px" }}>
          새 배너 추가 ({group})
        </p>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <input
          type="text"
          placeholder="링크 URL (https://... , 선택)"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          style={{
            width: "100%",
            border: "1.5px solid var(--cream-2)",
            borderRadius: 3,
            padding: "9px 12px",
            fontSize: 13,
            marginBottom: 10,
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={handleAdd}
          disabled={saving}
          style={{
            border: "none",
            borderRadius: 3,
            padding: "9px 18px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            background: "var(--green-500)",
            color: "#fff",
          }}
        >
          {saving ? "등록 중..." : "배너 추가"}
        </button>
        {error && <p style={{ color: "var(--cta)", fontSize: 12, marginTop: 8 }}>{error}</p>}
      </div>
    </div>
  );
}

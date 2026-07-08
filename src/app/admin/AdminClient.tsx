"use client";

import { useEffect, useState } from "react";
import AdminBannerList from "./AdminBannerList";

export default function AdminClient() {
  const [status, setStatus] = useState<"loading" | "ok" | "denied">("loading");
  const [email, setEmail] = useState("");

  useEffect(() => {
    fetch("/api/admin/check")
      .then((r) => r.json() as Promise<{ ok: boolean; email?: string }>)
      .then((data) => {
        if (data.ok) {
          setEmail(data.email ?? "");
          setStatus("ok");
        } else {
          setStatus("denied");
        }
      })
      .catch(() => setStatus("denied"));
  }, []);

  if (status === "loading") {
    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "60px 30px", color: "var(--ink-soft)", fontSize: 14 }}>
        확인 중...
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div style={{ maxWidth: 480, margin: "80px auto", padding: "0 30px", textAlign: "center" }}>
        <h1 style={{ fontSize: 20, color: "var(--green-900)" }}>접근 권한이 없습니다</h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>
          관리자로 등록된 계정으로 로그인해야 이 페이지를 볼 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "30px 30px 80px" }}>
      <h1 style={{ fontSize: 22, color: "var(--green-900)" }}>광고 배너 관리</h1>
      <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>
        {email} 로 로그인됨 · 그룹당 배너 수 제한 없음.
      </p>
      <AdminBannerList />
    </div>
  );
}

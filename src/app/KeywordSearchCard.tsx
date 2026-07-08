"use client";

import { useState } from "react";

// "요즘 뜨는 키워드 찾기" 카드. 소스에 따라 서버가 부르는 네이버 API가 다르고
// (src/app/api/keywords/route.ts, src/lib/naver.ts 참고), 그래서 결과 화면도 다르다:
// - 검색광고API: 연관키워드 + 검색량 표
// - 오픈API: 최근 6개월 검색량 추이 그래프 (상대값, 실제 검색 건수 아님)

type SearchAdRow = {
  relKeyword: string;
  monthlyPcQcCnt: number | string;
  monthlyMobileQcCnt: number | string;
  compIdx: string;
};
type TrendPoint = { period: string; ratio: number };

export default function KeywordSearchCard() {
  const [source, setSource] = useState<"naver_open" | "naver_searchad">("naver_searchad");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<SearchAdRow[] | null>(null);
  const [trend, setTrend] = useState<TrendPoint[] | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setRows(null);
    setTrend(null);
    try {
      const res = await fetch(`/api/keywords?q=${encodeURIComponent(query)}&source=${source}`);
      const data = (await res.json()) as {
        error?: string;
        keywords?: SearchAdRow[];
        trend?: TrendPoint[];
      };
      if (!res.ok) throw new Error(data.error ?? "검색에 실패했습니다.");
      if (source === "naver_searchad") setRows(data.keywords ?? []);
      else setTrend(data.trend ?? []);
    } catch (e: any) {
      setError(e.message ?? "검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={cardStyle}>
      <p style={cardTitleStyle}>요즘 뜨는 키워드 찾기</p>
      <p style={cardDescStyle}>검색 소스를 선택하고 시드 키워드를 입력하세요.</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div
          onClick={() => setSource("naver_open")}
          style={sourceChipStyle(source === "naver_open")}
        >
          오픈API (검색량 추이 그래프)
        </div>
        <div
          onClick={() => setSource("naver_searchad")}
          style={sourceChipStyle(source === "naver_searchad")}
        >
          검색광고API (연관키워드 표)
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <input
          style={searchInputStyle}
          placeholder="예: 여름 원피스, 캠핑 의자"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{ border: "none", borderRadius: 3, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", background: "var(--green-500)", color: "#fff" }}
        >
          {loading ? "검색 중..." : "검색"}
        </button>
      </div>

      {error && <p style={{ color: "var(--cta)", fontSize: 13, marginTop: 12 }}>{error}</p>}

      {rows && (
        <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1.5px solid var(--cream-2)", textAlign: "left" }}>
              <th style={thStyle}>연관키워드</th>
              <th style={thStyle}>PC 검색량</th>
              <th style={thStyle}>모바일 검색량</th>
              <th style={thStyle}>경쟁도</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={4} style={{ ...tdStyle, color: "var(--ink-soft)" }}>결과가 없습니다.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.relKeyword} style={{ borderBottom: "1px solid var(--cream-2)" }}>
                <td style={tdStyle}>{r.relKeyword}</td>
                <td style={tdStyle}>{r.monthlyPcQcCnt}</td>
                <td style={tdStyle}>{r.monthlyMobileQcCnt}</td>
                <td style={tdStyle}>{r.compIdx}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {trend && <TrendChart points={trend} />}
    </div>
  );
}

// 데이터랩이 주는 값은 0~100 사이 "상대값"이라 절대 검색 건수는 아니고,
// 그 기간 안에서 가장 많이 검색된 시점을 100으로 뒀을 때 상대적인 비율이다.
function TrendChart({ points }: { points: TrendPoint[] }) {
  if (points.length === 0)
    return <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 16 }}>결과가 없습니다.</p>;

  const width = 640;
  const height = 160;
  const stepX = width / Math.max(points.length - 1, 1);
  const coords = points.map((p, i) => `${i * stepX},${height - (p.ratio / 100) * height}`);

  return (
    <div style={{ marginTop: 16 }}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
        <polyline
          points={coords.join(" ")}
          fill="none"
          stroke="var(--green-500)"
          strokeWidth={2}
        />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-soft)", marginTop: 4 }}>
        <span>{points[0].period}</span>
        <span>{points[points.length - 1].period}</span>
      </div>
    </div>
  );
}

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
const searchInputStyle: React.CSSProperties = {
  flex: 1,
  border: "1.5px solid var(--cream-2)",
  borderRadius: 3,
  padding: "13px 18px",
  fontSize: 14,
  background: "var(--cream)",
  color: "var(--ink)",
  outline: "none",
};
const sourceChipStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  border: `1.5px solid ${active ? "var(--green-500)" : "var(--cream-2)"}`,
  borderRadius: 3,
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 600,
  color: active ? "var(--green-700)" : "var(--ink-soft)",
  background: active ? "var(--green-100)" : "var(--cream)",
  cursor: "pointer",
  textAlign: "center",
});
const thStyle: React.CSSProperties = { padding: "8px 6px", color: "var(--ink-soft)", fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: "8px 6px" };

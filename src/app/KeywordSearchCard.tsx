"use client";

import { useState } from "react";

// "요즘 뜨는 키워드 찾기" 카드. 등록해둔 네이버 키 종류에 따라 서버(/api/keywords)가
// 검색광고 키워드도구 + 데이터랩(추이/요일/성별/연령대) + 블로그·카페 총 발행량을
// 한 번에 모아서 돌려주고, 여기서는 그걸 표/그래프/차트로 보여주기만 한다.
// 둘 다 등록 안 해뒀으면 서버가 404를 준다.

type SearchAdRow = {
  relKeyword: string;
  monthlyPcQcCnt: number | string;
  monthlyMobileQcCnt: number | string;
  compIdx: string;
};
type TrendSeries = { title: string; data: { period: string; ratio: number }[] };
type WeekdayPoint = { day: string; avgRatio: number };
type AgePoint = { ageLabel: string; ratio: number };
type SearchResult = {
  keyword: string;
  compareKeywords: string[];
  keywords?: SearchAdRow[];
  trend?: TrendSeries[];
  weekday?: WeekdayPoint[];
  gender?: { male: number; female: number };
  age?: AgePoint[];
  totals?: { blog: number; cafe: number };
  missingSources: string[];
};

const LINE_COLORS = ["#2f8f5b", "#c96b3c", "#3c6bc9", "#c93c8f", "#8f3cc9"];

export default function KeywordSearchCard() {
  const [query, setQuery] = useState("");
  const [compareInputs, setCompareInputs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const compare = compareInputs.map((s) => s.trim()).filter(Boolean).join(",");
      const url = `/api/keywords?q=${encodeURIComponent(query)}${compare ? `&compare=${encodeURIComponent(compare)}` : ""}`;
      const res = await fetch(url);
      const data = (await res.json()) as SearchResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "검색에 실패했습니다.");
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? "검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function downloadCsv() {
    if (!result?.keywords?.length) return;
    const header = "연관키워드,PC 검색량,모바일 검색량,경쟁도\n";
    const rows = result.keywords
      .map((r) => `${r.relKeyword},${r.monthlyPcQcCnt},${r.monthlyMobileQcCnt},${r.compIdx}`)
      .join("\n");
    const blob = new Blob(["﻿" + header + rows], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${result.keyword}_연관키워드.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div style={cardStyle}>
      <p style={cardTitleStyle}>요즘 뜨는 키워드 찾기</p>
      <p style={cardDescStyle}>
        시드 키워드를 입력하세요. 등록해둔 네이버 API 키에 따라 표/그래프/분포가 자동으로 나와요.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
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

      {/* 비교 키워드: 그래프에 같이 그려서 비교할 수 있음 (메인 포함 최대 5개) */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {compareInputs.map((v, i) => (
          <input
            key={i}
            style={{ ...compareInputStyle, borderColor: LINE_COLORS[i + 1] }}
            placeholder="비교 키워드"
            value={v}
            onChange={(e) => {
              const next = [...compareInputs];
              next[i] = e.target.value;
              setCompareInputs(next);
            }}
          />
        ))}
        {compareInputs.length < 4 && (
          <button
            onClick={() => setCompareInputs([...compareInputs, ""])}
            style={addCompareBtnStyle}
          >
            + 비교 키워드 추가
          </button>
        )}
      </div>

      {error && <p style={{ color: "var(--cta)", fontSize: 13, marginBottom: 12 }}>{error}</p>}

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {result.totals && (
            <div style={{ display: "flex", gap: 10 }}>
              <StatBox label="블로그 총 발행량" value={result.totals.blog.toLocaleString()} />
              <StatBox label="카페 총 발행량" value={result.totals.cafe.toLocaleString()} />
            </div>
          )}

          {result.trend && result.trend.length > 0 && (
            <div>
              <SectionTitle>검색량 추이 (최근 6개월, 상대값)</SectionTitle>
              <TrendChart series={result.trend} />
            </div>
          )}

          {result.keywords && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <SectionTitle>연관키워드 · 검색량</SectionTitle>
                <button onClick={downloadCsv} style={csvBtnStyle}>엑셀 다운로드 (CSV)</button>
              </div>
              <table style={{ width: "100%", marginTop: 8, borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1.5px solid var(--cream-2)", textAlign: "left" }}>
                    <th style={thStyle}>연관키워드</th>
                    <th style={thStyle}>PC 검색량</th>
                    <th style={thStyle}>모바일 검색량</th>
                    <th style={thStyle}>경쟁도</th>
                  </tr>
                </thead>
                <tbody>
                  {result.keywords.length === 0 && (
                    <tr><td colSpan={4} style={{ ...tdStyle, color: "var(--ink-soft)" }}>결과가 없습니다.</td></tr>
                  )}
                  {result.keywords.map((r) => (
                    <tr key={r.relKeyword} style={{ borderBottom: "1px solid var(--cream-2)" }}>
                      <td style={tdStyle}>{r.relKeyword}</td>
                      <td style={tdStyle}>{r.monthlyPcQcCnt}</td>
                      <td style={tdStyle}>{r.monthlyMobileQcCnt}</td>
                      <td style={tdStyle}>{r.compIdx}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(result.weekday || result.gender || result.age) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {result.weekday && (
                <div>
                  <SectionTitle>요일 분포</SectionTitle>
                  <BarChart items={result.weekday.map((w) => ({ label: w.day, value: w.avgRatio }))} />
                </div>
              )}
              {result.gender && (
                <div>
                  <SectionTitle>성별 분포</SectionTitle>
                  <BarChart
                    items={[
                      { label: "남성", value: result.gender.male },
                      { label: "여성", value: result.gender.female },
                    ]}
                    unit="%"
                  />
                </div>
              )}
              {result.age && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <SectionTitle>연령대 분포</SectionTitle>
                  <BarChart items={result.age.map((a) => ({ label: a.ageLabel, value: a.ratio }))} unit="%" />
                </div>
              )}
            </div>
          )}

          {result.missingSources.length > 0 && (
            <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>
              {result.missingSources.includes("naver_searchad") && "검색광고 API 키를 등록하면 연관키워드 표를 볼 수 있어요. "}
              {result.missingSources.includes("naver_open") && "오픈API 키를 등록하면 추이/요일/성별/연령대 분포를 볼 수 있어요."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 13, fontWeight: 700, color: "var(--green-900)", margin: "0 0 8px" }}>{children}</p>;
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, background: "var(--cream)", border: "1px solid var(--cream-2)", borderRadius: 3, padding: "12px 16px" }}>
      <p style={{ fontSize: 11, color: "var(--ink-soft)", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 700, color: "var(--green-900)", margin: 0 }}>{value}</p>
    </div>
  );
}

// 데이터랩이 주는 값은 0~100 사이 "상대값"이라 절대 검색 건수는 아니고,
// 조회 기간 안에서 가장 많이 검색된 시점을 100으로 뒀을 때 상대적인 비율이다.
function TrendChart({ series }: { series: TrendSeries[] }) {
  const points = series[0]?.data ?? [];
  if (points.length === 0)
    return <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>결과가 없습니다.</p>;

  const width = 640;
  const height = 160;
  const stepX = width / Math.max(points.length - 1, 1);

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
        {series.map((s, i) => (
          <polyline
            key={s.title}
            points={s.data.map((p, j) => `${j * stepX},${height - (p.ratio / 100) * height}`).join(" ")}
            fill="none"
            stroke={LINE_COLORS[i % LINE_COLORS.length]}
            strokeWidth={2}
          />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-soft)", marginTop: 4 }}>
        <span>{points[0].period}</span>
        <span>{points[points.length - 1].period}</span>
      </div>
      {series.length > 1 && (
        <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
          {series.map((s, i) => (
            <span key={s.title} style={{ fontSize: 12, color: "var(--ink-soft)" }}>
              <span style={{ display: "inline-block", width: 10, height: 10, background: LINE_COLORS[i % LINE_COLORS.length], marginRight: 4, borderRadius: 2 }} />
              {s.title}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function BarChart({ items, unit }: { items: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 56, fontSize: 12, color: "var(--ink-soft)", flexShrink: 0 }}>{item.label}</span>
          <div style={{ flex: 1, background: "var(--cream)", borderRadius: 2, height: 14 }}>
            <div style={{ width: `${(item.value / max) * 100}%`, background: "var(--green-500)", height: "100%", borderRadius: 2 }} />
          </div>
          <span style={{ width: 48, fontSize: 12, color: "var(--ink-soft)", textAlign: "right", flexShrink: 0 }}>
            {item.value}{unit ?? ""}
          </span>
        </div>
      ))}
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
const compareInputStyle: React.CSSProperties = {
  border: "1.5px solid var(--cream-2)",
  borderRadius: 3,
  padding: "8px 12px",
  fontSize: 13,
  background: "var(--cream)",
  outline: "none",
  width: 140,
};
const addCompareBtnStyle: React.CSSProperties = {
  border: "1.5px dashed var(--green-300)",
  background: "transparent",
  color: "var(--green-700)",
  borderRadius: 3,
  padding: "8px 12px",
  fontSize: 12,
  cursor: "pointer",
};
const csvBtnStyle: React.CSSProperties = {
  border: "1px solid var(--cream-2)",
  background: "var(--cream)",
  color: "var(--green-700)",
  borderRadius: 3,
  padding: "6px 12px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};
const thStyle: React.CSSProperties = { padding: "8px 6px", color: "var(--ink-soft)", fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: "8px 6px" };

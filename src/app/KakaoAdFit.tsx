"use client";

import { useEffect } from "react";

// 카카오 AdFit 스크립트(ba.min.js)는 페이지에 한 번만 로드하면 되고, 로드되는 시점에
// DOM에 있는 모든 .kakao_ad_area 요소를 한 번에 찾아서 광고로 채운다. 그래서 여러 개의
// <ins> 광고 영역을 동시에 써도 스크립트는 전역에서 한 번만 삽입한다.
let kakaoScriptLoaded = false;

export default function KakaoAdFit({
  adUnit,
  width,
  height,
}: {
  adUnit: string;
  width: number;
  height: number;
}) {
  useEffect(() => {
    if (kakaoScriptLoaded) return;
    kakaoScriptLoaded = true;
    const script = document.createElement("script");
    script.src = "//t1.kakaocdn.net/kas/static/ba.min.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <ins
      className="kakao_ad_area"
      style={{ display: "none" }}
      data-ad-unit={adUnit}
      data-ad-width={width}
      data-ad-height={height}
    />
  );
}

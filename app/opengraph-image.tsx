import { ImageResponse } from "next/og";
import { loadKoreanFont } from "@/lib/og-font";

// 사이트 기본 OG 카드 — 자체 opengraph-image가 없는 모든 페이지(랜딩·상품·일간·테스트 인트로)에 적용.
// 이게 없으면 카카오톡·인스타 공유 카드가 텍스트만 떠서 공유 유입 루프가 죽는다.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "오롭미 — 회원가입 없는 무료 AI 사주";

export default async function Image() {
  const text = "오롭미 | All of Me계산은 만세력으로 정확하게해석은 깊이 있게회원가입 없이 30초 · 무료사주";
  const font = await loadKoreanFont(text);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf7f2",
          fontFamily: "NotoKR",
          color: "#3d3d3d",
        }}
      >
        {/* 오롭이 캐릭터 (인라인 SVG — Satori 지원) */}
        <svg width="190" height="190" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="88" fill="#efe9f7" />
          <circle cx="40" cy="48" r="3" fill="#c9bce0" />
          <circle cx="164" cy="72" r="2.5" fill="#c9bce0" />
          <circle cx="150" cy="28" r="2" fill="#c9bce0" />
          <path d="M100 80 C 60 80 48 120 44 164 L 156 164 C 152 120 140 80 100 80 Z" fill="#8f7bb8" />
          <path d="M100 88 C 93 112 91 138 93 162 L 107 162 C 109 138 107 112 100 88 Z" fill="#7c68a6" />
          <ellipse cx="64" cy="132" rx="17" ry="12" fill="#8f7bb8" />
          <ellipse cx="136" cy="132" rx="17" ry="12" fill="#8f7bb8" />
          <circle cx="100" cy="130" r="18" fill="#ffe9a8" stroke="#f0c96a" strokeWidth="2" />
          <circle cx="93" cy="123" r="5" fill="#fff5d6" />
          <circle cx="100" cy="60" r="34" fill="#fdf3e7" />
          <path d="M58 50 L100 10 L142 50 Q100 62 58 50 Z" fill="#5d4a85" />
          <ellipse cx="100" cy="50" rx="47" ry="9" fill="#6b5796" />
          <circle cx="100" cy="20" r="4.5" fill="#ffe9a8" />
          <path d="M83 63 q5 5 10 0" stroke="#4a3f66" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M107 63 q5 5 10 0" stroke="#4a3f66" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="80" cy="72" r="4" fill="#f6c9c0" />
          <circle cx="120" cy="72" r="4" fill="#f6c9c0" />
          <path d="M96 76 q4 4 8 0" stroke="#4a3f66" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M91 83 q9 9 18 0 q-3 14 -9 14 q-6 0 -9 -14 z" fill="#f7f3ec" />
        </svg>
        <div style={{ fontSize: 30, marginTop: 26, color: "#8f7bb8", letterSpacing: 6 }}>
          오롭미 | All of Me
        </div>
        <div style={{ fontSize: 58, fontWeight: 700, marginTop: 16, textAlign: "center" }}>
          계산은 만세력으로 정확하게
        </div>
        <div style={{ fontSize: 58, fontWeight: 700, marginTop: 4, textAlign: "center" }}>
          해석은 깊이 있게
        </div>
        <div style={{ fontSize: 28, marginTop: 30, color: "#7a7a7a" }}>
          회원가입 없이 30초 · 무료사주
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "NotoKR", data: font, weight: 700, style: "normal" }] },
  );
}

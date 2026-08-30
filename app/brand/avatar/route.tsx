import { ImageResponse } from "next/og";
import { loadKoreanFont } from "@/lib/og-font";

// 브랜드 아바타 512×512 — 당근·인스타·스레드 프로필 이미지용
// v2 (2026-08-17): "허접하다" 피드백 반영 — 딥네이비 별밤 + 오롭이 + 오롭미 워드마크.
// 프로필은 원형으로 크롭되므로 모든 요소를 중앙 원(r≈250) 안에 배치한다.
// 사용: /brand/avatar 접속 → 우클릭 저장
export const runtime = "nodejs";

export async function GET() {
  const font = await loadKoreanFont("오롭미ALL OF ME");
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
          background: "#272132",
          fontFamily: "NotoKR",
        }}
      >
        <svg width="512" height="512" viewBox="0 0 512 512" style={{ position: "absolute", top: 0, left: 0 }}>
          {/* 별밤 — 원형 크롭 안쪽에만 뿌린다 */}
          <circle cx="150" cy="92" r="3" fill="#b9a9dd" opacity="0.9" />
          <circle cx="368" cy="76" r="2.2" fill="#b9a9dd" opacity="0.7" />
          <circle cx="404" cy="170" r="2.8" fill="#cfc4e8" opacity="0.8" />
          <circle cx="96" cy="196" r="2.2" fill="#cfc4e8" opacity="0.6" />
          <circle cx="120" cy="330" r="2.4" fill="#b9a9dd" opacity="0.7" />
          <circle cx="396" cy="318" r="2.6" fill="#b9a9dd" opacity="0.8" />
          <circle cx="256" cy="52" r="2.4" fill="#cfc4e8" opacity="0.8" />
          <circle cx="330" cy="118" r="1.8" fill="#8f7bb8" opacity="0.9" />
          <circle cx="176" cy="140" r="1.8" fill="#8f7bb8" opacity="0.8" />
          {/* 초승달 */}
          <path d="M392 108 a26 26 0 1 0 14 46 a20 20 0 1 1 -14 -46 Z" fill="#ffe9a8" opacity="0.95" />
          {/* 은은한 후광 */}
          <circle cx="256" cy="212" r="150" fill="#8f7bb8" opacity="0.14" />
          <circle cx="256" cy="212" r="118" fill="#8f7bb8" opacity="0.16" />
          {/* 오롭이 — 갓 쓴 꼬마 도령 (200 viewBox 도안을 1.32배로 중앙 배치) */}
          <g transform="translate(124, 86) scale(1.32)">
            <path d="M100 80 C 60 80 48 120 44 164 L 156 164 C 152 120 140 80 100 80 Z" fill="#9d8ac4" />
            <path d="M100 88 C 93 112 91 138 93 162 L 107 162 C 109 138 107 112 100 88 Z" fill="#8571b0" />
            <ellipse cx="64" cy="132" rx="17" ry="12" fill="#9d8ac4" />
            <ellipse cx="136" cy="132" rx="17" ry="12" fill="#9d8ac4" />
            <circle cx="100" cy="130" r="18" fill="#ffe9a8" stroke="#f0c96a" strokeWidth="2" />
            <circle cx="93" cy="123" r="5" fill="#fff5d6" />
            <circle cx="100" cy="60" r="34" fill="#fdf3e7" />
            <path d="M58 50 L100 10 L142 50 Q100 62 58 50 Z" fill="#4f3d78" />
            <ellipse cx="100" cy="50" rx="47" ry="9" fill="#5d4a8c" />
            <circle cx="100" cy="20" r="4.5" fill="#ffe9a8" />
            <path d="M83 63 q5 5 10 0" stroke="#4a3f66" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M107 63 q5 5 10 0" stroke="#4a3f66" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <circle cx="80" cy="72" r="4" fill="#f6c9c0" />
            <circle cx="120" cy="72" r="4" fill="#f6c9c0" />
            <path d="M96 76 q4 4 8 0" stroke="#4a3f66" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M91 83 q9 9 18 0 q-3 14 -9 14 q-6 0 -9 -14 z" fill="#f7f3ec" />
          </g>
        </svg>
        {/* 워드마크 — 원형 크롭 안전권(하단) */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 274 }}>
          <div style={{ fontSize: 78, fontWeight: 700, color: "#faf7f2", letterSpacing: 10 }}>오롭미</div>
          <div style={{ fontSize: 19, color: "#b9a9dd", letterSpacing: 8, marginTop: 6 }}>ALL OF ME</div>
        </div>
      </div>
    ),
    { width: 512, height: 512, fonts: [{ name: "NotoKR", data: font, weight: 700, style: "normal" }] },
  );
}

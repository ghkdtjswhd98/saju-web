import { ImageResponse } from "next/og";

// 브랜드 아바타 512×512 — 당근·인스타·스레드 프로필 이미지용 (오롭이 단독)
// 사용: /brand/avatar 접속 → 우클릭 저장
export const runtime = "nodejs";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#8f7bb8",
        }}
      >
        <svg width="470" height="470" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="92" fill="#efe9f7" />
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
      </div>
    ),
    { width: 512, height: 512 },
  );
}

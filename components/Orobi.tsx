// 오롭이 — 오롭미의 도사 캐릭터 (인라인 SVG, 외부 에셋 없음)
// 콘텐츠·랜딩·결과 페이지의 화자. 보름달 후광 + 갓 + 여의주 구슬.
export default function Orobi({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="오롭미 캐릭터 오롭이"
    >
      {/* 달 후광 */}
      <circle cx="100" cy="100" r="88" fill="#efe9f7" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="#e0d6ef" strokeWidth="2" />
      {/* 별 장식 */}
      <circle cx="40" cy="48" r="3" fill="#c9bce0" />
      <circle cx="164" cy="72" r="2.5" fill="#c9bce0" />
      <circle cx="150" cy="28" r="2" fill="#c9bce0" />
      <circle cx="30" cy="110" r="2" fill="#c9bce0" />
      {/* 몸통 (로브) */}
      <path d="M100 80 C 60 80 48 120 44 164 L 156 164 C 152 120 140 80 100 80 Z" fill="#8f7bb8" />
      <path d="M100 88 C 93 112 91 138 93 162 L 107 162 C 109 138 107 112 100 88 Z" fill="#7c68a6" />
      {/* 소매 */}
      <ellipse cx="64" cy="132" rx="17" ry="12" fill="#8f7bb8" />
      <ellipse cx="136" cy="132" rx="17" ry="12" fill="#8f7bb8" />
      {/* 여의주 구슬 */}
      <circle cx="100" cy="130" r="18" fill="#ffe9a8" stroke="#f0c96a" strokeWidth="2" />
      <circle cx="93" cy="123" r="5" fill="#fff5d6" />
      {/* 얼굴 */}
      <circle cx="100" cy="60" r="34" fill="#fdf3e7" />
      {/* 갓 */}
      <path d="M58 50 L100 10 L142 50 Q100 62 58 50 Z" fill="#5d4a85" />
      <ellipse cx="100" cy="50" rx="47" ry="9" fill="#6b5796" />
      <circle cx="100" cy="20" r="4.5" fill="#ffe9a8" />
      {/* 감은 눈 (행복) */}
      <path d="M83 63 q5 5 10 0" stroke="#4a3f66" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M107 63 q5 5 10 0" stroke="#4a3f66" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* 볼터치 */}
      <circle cx="80" cy="72" r="4" fill="#f6c9c0" />
      <circle cx="120" cy="72" r="4" fill="#f6c9c0" />
      {/* 입 */}
      <path d="M96 76 q4 4 8 0" stroke="#4a3f66" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* 수염 */}
      <path d="M91 83 q9 9 18 0 q-3 14 -9 14 q-6 0 -9 -14 z" fill="#f7f3ec" />
    </svg>
  );
}

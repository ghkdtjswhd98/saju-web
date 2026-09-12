// 순위 뱃지 — 이모지 메달 대신 SVG 원형(금/은/동), 4위부터는 중립색 숫자
const MEDAL: Record<number, { fill: string; ring: string; ink: string }> = {
  1: { fill: "#E6BE55", ring: "#B48A22", ink: "#3B2E0C" },
  2: { fill: "#CBD0D8", ring: "#8F98A5", ink: "#2B2F36" },
  3: { fill: "#D2925C", ring: "#9E663A", ink: "#3A230F" },
};

export default function RankBadge({ rank, size = 32 }: { rank: number; size?: number }) {
  const m = MEDAL[rank];
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label={`${rank}위`}>
      <circle
        cx="16"
        cy="16"
        r="14"
        fill={m ? m.fill : "var(--bg)"}
        stroke={m ? m.ring : "var(--border)"}
        strokeWidth="2"
      />
      {m && <circle cx="16" cy="16" r="10.5" fill="none" stroke={m.ring} strokeWidth="1" opacity="0.55" />}
      <text
        x="16"
        y="20.5"
        textAnchor="middle"
        fontSize={rank >= 10 ? 11 : 13}
        fontWeight="700"
        fill={m ? m.ink : "var(--ink-soft)"}
      >
        {rank}
      </text>
    </svg>
  );
}

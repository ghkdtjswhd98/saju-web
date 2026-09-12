import type { ChemiRankRow } from "@/lib/saju/chemi-link";
import RankBadge from "./RankBadge";

// 케미 순위판 — 주인은 전체, 친구는 상위 5. 비어 있으면 첫 초대를 유도한다.
export default function RankingBoard({
  rows,
  total,
  highlight,
  emptyText = "첫 친구를 초대해 보세요",
}: {
  rows: ChemiRankRow[];
  total: number;
  /** 방금 답한 친구 별명 — 본인 줄을 강조 */
  highlight?: string;
  emptyText?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-card px-5 py-8 text-center">
        <p className="text-sm font-bold text-ink">{emptyText}</p>
        <p className="mt-1 text-xs leading-5 text-ink-soft">친구가 생일을 넣으면 여기에 순위가 쌓여요</p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <ul className="divide-y divide-line">
        {rows.map((r, i) => {
          const mine = highlight !== undefined && r.nickname === highlight;
          return (
            <li
              key={`${r.rank}-${r.nickname}-${i}`}
              className={`flex min-h-14 items-center gap-3 px-4 py-2.5 ${mine ? "bg-accent-soft/40" : ""}`}
            >
              <RankBadge rank={r.rank} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">
                  {r.nickname}
                  {mine && <span className="ml-1.5 text-[11px] font-medium text-accent-strong">나</span>}
                </p>
                <p className="truncate text-xs text-ink-soft">{r.label}</p>
              </div>
              <p className="shrink-0 text-lg font-bold text-accent-strong">{r.score}</p>
            </li>
          );
        })}
      </ul>
      {total > rows.length && (
        <p className="border-t border-line px-4 py-2.5 text-center text-xs text-ink-soft">
          외 {total - rows.length}명 더 — 전체 순위는 링크 주인만 볼 수 있어요
        </p>
      )}
    </div>
  );
}

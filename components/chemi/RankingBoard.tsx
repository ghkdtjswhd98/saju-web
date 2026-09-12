import type { ChemiRankRow } from "@/lib/saju/chemi-link";
import LockIcon from "./LockIcon";
import RankBadge from "./RankBadge";

// 케미 순위판 — 주인은 전체(비공개 행엔 자물쇠 뱃지), 친구는 비공개를 뺀 상위 5 + "비공개 n명".
// 주인이 잠그면(locked) 친구에게는 목록 대신 잠금 카드만. 비어 있으면 첫 초대를 유도한다.
export default function RankingBoard({
  rows,
  total,
  highlight,
  emptyText = "첫 친구를 초대해 보세요",
  locked = false,
  privateCount = 0,
}: {
  rows: ChemiRankRow[];
  total: number;
  /** 방금 답한 친구 별명 — 본인 줄을 강조 */
  highlight?: string;
  emptyText?: string;
  /** 친구 뷰: 주인이 "나만 보기"로 잠근 상태 */
  locked?: boolean;
  /** 친구 뷰: 목록에서 뺀 비공개 응답 수 */
  privateCount?: number;
}) {
  if (locked) {
    return (
      <div className="rounded-2xl border border-line bg-card px-5 py-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft/60 text-accent-strong">
          <LockIcon size={22} />
        </span>
        <p className="mt-3 text-sm font-bold text-ink">이 순위판은 주인만 볼 수 있어요</p>
        <p className="mt-1 text-xs leading-5 text-ink-soft">
          {total > 0 ? `지금까지 ${total}명이 답했어요 · 내 결과는 위에서 볼 수 있어요` : "친구가 답하면 주인에게 순위가 쌓여요"}
        </p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-card px-5 py-8 text-center">
        {privateCount > 0 ? (
          <>
            <p className="text-sm font-bold text-ink">비공개로 {privateCount}명이 답했어요</p>
            <p className="mt-1 text-xs leading-5 text-ink-soft">이름과 점수는 링크 주인에게만 보여요</p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-ink">{emptyText}</p>
            <p className="mt-1 text-xs leading-5 text-ink-soft">친구가 생일을 넣으면 여기에 순위가 쌓여요</p>
          </>
        )}
      </div>
    );
  }

  // 친구 뷰 하단 안내: 상위 N 밖의 공개 응답 + 비공개 응답 (주인 뷰는 전체가 보이므로 둘 다 0)
  const hiddenMore = Math.max(0, total - privateCount - rows.length);
  const footer: string[] = [];
  if (hiddenMore > 0) footer.push(`외 ${hiddenMore}명 더`);
  if (privateCount > 0) footer.push(`비공개 ${privateCount}명`);

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
                <p className="flex min-w-0 items-center gap-1.5 text-sm font-bold text-ink">
                  <span className="truncate">{r.nickname}</span>
                  {mine && <span className="shrink-0 text-[11px] font-medium text-accent-strong">나</span>}
                  {r.isPrivate && (
                    <span
                      className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-accent-soft/60 px-1.5 py-0.5 text-[10px] font-medium text-accent-strong"
                      title="링크 주인에게만 보여요"
                    >
                      <LockIcon size={10} />
                      비공개
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-ink-soft">{r.label}</p>
              </div>
              <p className="shrink-0 text-lg font-bold text-accent-strong">{r.score}</p>
            </li>
          );
        })}
      </ul>
      {footer.length > 0 && (
        <p className="border-t border-line px-4 py-2.5 text-center text-xs text-ink-soft">
          {footer.join(" · ")} — 전체 순위는 링크 주인만 볼 수 있어요
        </p>
      )}
    </div>
  );
}

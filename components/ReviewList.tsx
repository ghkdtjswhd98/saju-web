import { getProduct } from "@/lib/products";
import { getReviewSummary } from "@/lib/reviews";

function Stars({ n }: { n: number }) {
  return (
    <span className="text-sm text-amber-400" aria-label={`별점 ${n}점`}>
      {"★".repeat(n)}
      <span className="text-line">{"★".repeat(5 - n)}</span>
    </span>
  );
}

// 실후기 노출 섹션 — 후기 0건이면 아무것도 렌더하지 않음 (가짜 후기 절대 금지)
export default async function ReviewList({ limit = 4 }: { limit?: number }) {
  const { count, avg, recent } = await getReviewSummary(limit);
  if (count === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-center text-lg font-bold">먼저 받아본 분들의 이야기</h2>
      <p className="mt-1 text-center text-sm text-ink-soft">
        평균 <b className="text-accent-strong">{avg.toFixed(1)}점</b> · 리포트를 실제로 받은{" "}
        {count.toLocaleString()}명이 남긴 후기예요
      </p>
      <div className="mt-4 space-y-3">
        {recent.map((r) => (
          <div key={`${r.displayName}-${r.createdAt.getTime()}`} className="rounded-2xl border border-line bg-card p-4">
            <div className="flex items-center justify-between">
              <Stars n={r.rating} />
              <span className="text-xs text-ink-soft">
                {r.createdAt.getFullYear()}.{String(r.createdAt.getMonth() + 1).padStart(2, "0")}.
                {String(r.createdAt.getDate()).padStart(2, "0")}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6">{r.text}</p>
            <p className="mt-2 text-xs text-ink-soft">
              {r.displayName} · {getProduct(r.productCode)?.name ?? r.productCode}
              {r.isTester === 1 && (
                <span className="ml-1.5 rounded-full bg-bg px-2 py-0.5 text-[10px]">
                  체험단 제공
                </span>
              )}
              {r.isTester === 0 && (
                <span className="ml-1.5 rounded-full bg-accent-soft/60 px-2 py-0.5 text-[10px] text-accent-strong">
                  구매 확인됨
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

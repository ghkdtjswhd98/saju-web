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

// 실후기 노출 섹션 — 가짜 후기 절대 금지.
// 5건 미만이면 미노출: "후기 1명 · 평균 5.0"은 사회적 증거가 아니라 무실적 인증(역프루프)이다.
// 수집(리포트 페이지 폼)은 계속되고, 5건이 쌓이면 자동으로 켜진다.
export default async function ReviewList({ limit = 4 }: { limit?: number }) {
  const { count, avg, recent } = await getReviewSummary(limit);
  if (count < 5) return null;

  return (
    <section className="mt-12">
      {/* 수치를 헤드라인 자리로 승격 — 상위 판매자는 전부 별점·후기수를 제목 옆 최상단에 둔다 */}
      <h2 className="text-center text-lg font-bold">
        <span className="text-amber-400">★</span> {avg.toFixed(1)} · 후기{" "}
        {count.toLocaleString()}건
      </h2>
      <p className="mt-1 text-center text-sm text-ink-soft">
        리포트를 실제로 받은 분들만 남길 수 있어요
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

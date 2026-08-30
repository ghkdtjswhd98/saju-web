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
// 3건 미만이면 미노출: "후기 1명 · 평균 5.0"은 사회적 증거가 아니라 무실적 인증(역프루프)이다.
// 당근 진입으로 후기 수집 속도가 붙어 임계를 5→3으로 낮췄다. 3건이면 "여러 명"으로 읽힌다.
export default async function ReviewList({ limit = 4 }: { limit?: number }) {
  const { count, avg, recent } = await getReviewSummary(limit);
  if (count < 3) return null;

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
            {/* 대가성 표시 — 공정위 추천·보증 심사지침상 후기와 같은 화면에 붙어야 한다.
                체험단은 제품 자체가 대가이므로 그 라벨 하나로 충분하고,
                구매 후기라도 쿠폰을 받았으면 "리워드 제공"을 함께 단다. */}
            <p className="mt-2 text-xs text-ink-soft">
              {r.displayName} · {getProduct(r.productCode)?.name ?? r.productCode}
              {r.isTester === 1 ? (
                <span className="ml-1.5 rounded-full bg-bg px-2 py-0.5 text-[10px]">
                  체험단 제공
                </span>
              ) : (
                <span className="ml-1.5 rounded-full bg-accent-soft/60 px-2 py-0.5 text-[10px] text-accent-strong">
                  구매 확인됨
                </span>
              )}
              {r.isTester === 0 && r.rewardType === "coupon" && (
                <span className="ml-1.5 rounded-full bg-bg px-2 py-0.5 text-[10px]">
                  리워드 제공
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// 단계 가격 표시 — 현재가(굵게, 앞) + 정가 취소선(작게, 뒤)
// love119 벤치마킹(권고 6): 실가격이 먼저 크게 보여야 가격 위계가 잡힌다 — 취소선은 보조 정보.
export function PriceTag({
  current,
  list,
  size = "md",
  tone = "ink",
}: {
  current: number;
  list: number;
  size?: "sm" | "md" | "lg";
  tone?: "ink" | "gold"; // gold: 홈 1안 목업의 금색 현재가 — 홈 캐러셀에서만 쓴다(레일은 목업대로 잉크색)
}) {
  const discounted = current < list;
  const cls = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  const listCls = size === "lg" ? "text-sm" : "text-xs";
  const toneCls = tone === "gold" ? "text-[#FFE9A8]" : "text-ink";
  return (
    <span className={`${cls} font-bold ${toneCls} whitespace-nowrap`}>
      {current.toLocaleString()}원
      {discounted && (
        <span className={`ml-1.5 ${listCls} font-normal text-[#8A8398] line-through`}>
          {list.toLocaleString()}원
        </span>
      )}
    </span>
  );
}

// 실판매 기반 인상 카운터 배너 (진짜 데이터만 표시)
// 판매량이 적을 때는 "정직한 카운터"가 오히려 무실적 인증이 된다 —
// 신뢰 자산이 쌓인 뒤(30건+)에만 노출. 가격 로직 자체는 항상 동작.
export function PriceCounter({
  paidCount,
  remaining,
  allAtCap,
}: {
  paidCount: number;
  remaining: number;
  allAtCap: boolean;
}) {
  if (allAtCap || paidCount < 30) return null;
  return (
    <div className="rounded-xl border border-accent bg-accent-soft/50 px-4 py-3 text-center text-sm">
      <b className="text-accent-strong">오픈 특가 진행 중</b> — 지금까지{" "}
      <b>{paidCount.toLocaleString()}건</b> 판매,{" "}
      <b className="text-accent-strong">{remaining}건</b> 더 판매되면 가격이 1,000원 올라요
      <p className="mt-0.5 text-xs text-ink-soft">실제 판매량 기준으로 자동 인상되는 정직한 카운터예요</p>
    </div>
  );
}

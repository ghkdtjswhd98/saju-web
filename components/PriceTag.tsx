// 단계 가격 표시 — 정가 취소선 + 현재가 (+선택적 소형)
export function PriceTag({
  current,
  list,
  size = "md",
}: {
  current: number;
  list: number;
  size?: "sm" | "md" | "lg";
}) {
  const discounted = current < list;
  const cls = size === "lg" ? "text-lg" : size === "sm" ? "text-sm" : "text-[15px]";
  return (
    <span className={`${cls} font-bold text-accent-strong`}>
      {discounted && (
        <span className="mr-1.5 font-normal text-ink-soft line-through">
          {list.toLocaleString()}원
        </span>
      )}
      {current.toLocaleString()}원
    </span>
  );
}

// 실판매 기반 인상 카운터 배너 (진짜 데이터만 표시)
export function PriceCounter({
  paidCount,
  remaining,
  allAtCap,
}: {
  paidCount: number;
  remaining: number;
  allAtCap: boolean;
}) {
  if (allAtCap) return null;
  return (
    <div className="rounded-xl border border-accent bg-accent-soft/50 px-4 py-3 text-center text-sm">
      <b className="text-accent-strong">오픈 특가 진행 중</b> — 지금까지{" "}
      <b>{paidCount.toLocaleString()}건</b> 판매,{" "}
      <b className="text-accent-strong">{remaining}건</b> 더 판매되면 가격이 1,000원 올라요
      <p className="mt-0.5 text-xs text-ink-soft">실제 판매량 기준으로 자동 인상되는 정직한 카운터예요</p>
    </div>
  );
}

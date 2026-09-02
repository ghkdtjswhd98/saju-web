// 오픈 특가 마감 — 상세페이지 타임어택의 진실의 원천.
//
// ⚠️ 이 카운트다운은 장식이 아니라 실제로 작동한다: LAUNCH_END가 지나면
// lib/pricing.ts가 모든 상품을 openPrice가 아닌 listPrice(정가)로 계산한다.
// 가짜 마감(자정마다 리셋 등)은 표시광고법 위반 + 토스 심사 리스크라 쓰지 않는다.
// 마감을 미루고 싶으면 이 날짜를 바꾸고 배포하면 된다 — 단, 손님이 본 마감을
// 소리 없이 미루는 것도 신뢰 비용이므로 남용하지 말 것.
export const LAUNCH_END = new Date("2026-09-30T14:59:59Z"); // 2026-09-30 23:59:59 KST

export function isLaunchActive(now: Date = new Date()): boolean {
  return now < LAUNCH_END;
}

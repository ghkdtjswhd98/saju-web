// 실판매 기반 자동 가격 단계제 (초과수요 → 가격 인상 원칙의 자동화)
// 규칙: 전체 유료 판매 PER_STEP(10)건마다 모든 상품 가격이 STEP(1,000원)씩 인상, 정가(listPrice)가 상한.
// ⚠️ 카운터는 실제 결제 완료(orders.status='paid') 수만 사용한다 — 가짜 희소성 금지.
import { count, eq } from "drizzle-orm";
import { getDb, orders } from "./db";
import { PRODUCTS, type Product, type ProductCode } from "./products";

const STEP = 1000;
const PER_STEP = 10;

export interface PricingInfo {
  paidCount: number; // 지금까지 실제 유료 판매 수
  remainingToIncrease: number; // 다음 인상까지 남은 판매 수
  prices: Record<ProductCode, { current: number; list: number; atCap: boolean }>;
}

export function priceFor(product: Product, paidCount: number): number {
  const raised = product.openPrice + Math.floor(paidCount / PER_STEP) * STEP;
  return Math.min(raised, product.listPrice);
}

export async function getPricing(): Promise<PricingInfo> {
  const db = getDb();
  const rows = await db
    .select({ n: count() })
    .from(orders)
    .where(eq(orders.status, "paid"));
  const paidCount = rows[0]?.n ?? 0;

  const prices = {} as PricingInfo["prices"];
  for (const p of Object.values(PRODUCTS)) {
    const current = priceFor(p, paidCount);
    prices[p.code] = { current, list: p.listPrice, atCap: current >= p.listPrice };
  }
  return {
    paidCount,
    remainingToIncrease: PER_STEP - (paidCount % PER_STEP),
    prices,
  };
}

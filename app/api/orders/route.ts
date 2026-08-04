import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getDb, orders } from "@/lib/db";
import { getPricing } from "@/lib/pricing";
import { getProduct } from "@/lib/products";
import { checkActionLimit, getClientIp } from "@/lib/ratelimit";
import { computeAll } from "@/lib/saju/compute";
import { parsePersonInput } from "@/lib/validate";
import type { PersonInput } from "@/lib/saju/types";

export const runtime = "nodejs";

// 주문 생성 — 가격은 반드시 서버 카탈로그에서 확정 (클라이언트 금액 신뢰 금지)
export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    console.error("[api/orders]", err);
    const message = err instanceof Error ? err.message : "서버 오류가 발생했어요.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handle(req: Request) {
  // 주문 생성 스팸 방지 (DB 행 + computeAll CPU + 판매수 COUNT 쿼리 남용 차단)
  if (!(await checkActionLimit("order", getClientIp(req), 20))) {
    return NextResponse.json(
      { error: "주문 시도가 너무 많아요. 내일 다시 시도해주세요." },
      { status: 429 },
    );
  }

  let body: { productCode?: string; persons?: unknown[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const product = getProduct(body.productCode ?? "");
  if (!product) {
    return NextResponse.json({ error: "존재하지 않는 상품이에요." }, { status: 400 });
  }

  const rawPersons = Array.isArray(body.persons) ? body.persons : [];
  if (rawPersons.length !== product.personCount) {
    return NextResponse.json({ error: "입력 인원이 맞지 않아요." }, { status: 400 });
  }
  const persons: PersonInput[] = [];
  for (const raw of rawPersons) {
    const p = parsePersonInput(raw);
    if (!p) return NextResponse.json({ error: "입력값을 확인해주세요." }, { status: 400 });
    persons.push(p);
  }

  // 결제 전에 계산 가능 여부 검증 (지원 범위 밖 날짜로 결제되는 사고 방지)
  try {
    for (const p of persons) computeAll(p);
  } catch {
    return NextResponse.json(
      { error: "지원하지 않는 날짜예요. 1900~2050년 사이인지 확인해주세요." },
      { status: 400 },
    );
  }

  // 가격은 주문 생성 시점의 단계 가격으로 서버가 확정 (이후 인상돼도 이 주문은 고정)
  const pricing = await getPricing();
  const amount = pricing.prices[product.code].current;

  const orderId = `ord_${nanoid(18)}`;
  await getDb().insert(orders).values({
    id: orderId,
    productCode: product.code,
    amount,
    status: "pending",
    inputData: { persons },
  });

  return NextResponse.json({ orderId, amount });
}

import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getDb, orders } from "@/lib/db";
import { getProduct } from "@/lib/products";
import { computeAll } from "@/lib/saju/compute";
import { parsePersonInput } from "@/lib/validate";
import type { PersonInput } from "@/lib/saju/types";

export const runtime = "nodejs";

// 주문 생성 — 가격은 반드시 서버 카탈로그에서 확정 (클라이언트 금액 신뢰 금지)
export async function POST(req: Request) {
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

  const orderId = `ord_${nanoid(18)}`;
  await getDb().insert(orders).values({
    id: orderId,
    productCode: product.code,
    amount: product.price,
    status: "pending",
    inputData: { persons },
  });

  return NextResponse.json({ orderId });
}

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getDb, orders, reports } from "@/lib/db";
import { computeAll } from "@/lib/saju/compute";
import type { PersonInput } from "@/lib/saju/types";

export const runtime = "nodejs";

// 토스 결제 승인 — 서버 검증의 핵심.
// (a) 주문 존재/상태 확인 (b) 금액 일치 검증 (c) 토스 confirm API 호출 (d) 리포트 발급
export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    console.error("[api/payments/confirm]", err);
    const message = err instanceof Error ? err.message : "서버 오류가 발생했어요.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handle(req: Request) {
  let body: { paymentKey?: string; orderId?: string; amount?: number | string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }
  const { paymentKey, orderId } = body;
  const amount = Number(body.amount);
  if (!paymentKey || !orderId || !Number.isFinite(amount)) {
    return NextResponse.json({ error: "결제 정보가 누락됐어요." }, { status: 400 });
  }

  const db = getDb();
  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = rows[0];
  if (!order) return NextResponse.json({ error: "주문을 찾을 수 없어요." }, { status: 404 });

  // 멱등성: 이미 승인된 주문이면 기존 리포트 토큰 반환 (success 페이지 새로고침 대응)
  if (order.status === "paid" && order.reportToken) {
    return NextResponse.json({ token: order.reportToken });
  }
  if (order.status !== "pending") {
    return NextResponse.json({ error: "처리할 수 없는 주문 상태예요." }, { status: 409 });
  }

  // 금액 변조 방지 — 서버에 저장된 주문 금액과 반드시 일치해야 함
  if (amount !== order.amount) {
    return NextResponse.json({ error: "결제 금액이 일치하지 않아요." }, { status: 400 });
  }

  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "결제 설정이 완료되지 않았어요." }, { status: 500 });
  }

  // dev 전용 mock 승인 — 결제창 없이 성공 경로를 E2E 테스트하기 위한 우회로.
  // 프로덕션 빌드에서는 절대 동작하지 않는다.
  const isMockApproval =
    process.env.NODE_ENV !== "production" &&
    process.env.TOSS_MOCK === "1" &&
    paymentKey.startsWith("mock_");

  if (!isMockApproval) {
    // 토스 결제 승인 API
    const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    if (!tossRes.ok) {
      const err = (await tossRes.json().catch(() => ({}))) as { message?: string };
      await db.update(orders).set({ status: "failed" }).where(eq(orders.id, orderId));
      return NextResponse.json(
        { error: err.message ?? "결제 승인에 실패했어요." },
        { status: 402 },
      );
    }
  }

  // 승인 성공 → 리포트 발급 (사주 계산 스냅샷 포함)
  const persons = (order.inputData as { persons: PersonInput[] }).persons;
  const sajuData =
    persons.length === 2
      ? persons.map((p) => computeAll(p))
      : computeAll(persons[0]);

  const token = nanoid(24);
  await db.transaction(async (tx) => {
    await tx.insert(reports).values({
      token,
      orderId,
      productCode: order.productCode,
      inputData: { persons },
      sajuData,
      status: "pending",
    });
    await tx
      .update(orders)
      .set({ status: "paid", paymentKey, reportToken: token, approvedAt: new Date() })
      .where(eq(orders.id, orderId));
  });

  return NextResponse.json({ token });
}

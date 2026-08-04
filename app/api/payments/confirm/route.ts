import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getDb, orders, reports } from "@/lib/db";
import { getProduct } from "@/lib/products";
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
  // 토스 공식 문서의 공용 데모 키는 secret이 전 세계에 공개돼 있어, 누구든 데모 위젯으로
  // 유효한 paymentKey를 만들어 승인을 통과시킬 수 있다(= 유료 리포트 무한 무료 발급 + Opus 비용 실지출).
  // 실키(전자결제 심사 완료)로 교체되기 전까지 프로덕션 승인을 차단한다. 키 교체만으로 자동 해제.
  if (
    process.env.NODE_ENV === "production" &&
    (process.env.TOSS_SECRET_KEY ?? "").startsWith("test_gsk_docs")
  ) {
    return NextResponse.json(
      { error: "결제 시스템 오픈 준비 중이에요. 조금만 기다려주세요." },
      { status: 403 },
    );
  }

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
      // pending 가드 필수 — 동시 요청 경합에서 이미 paid가 된 주문을 failed로 덮어쓰는 사고 방지
      await db
        .update(orders)
        .set({ status: "failed" })
        .where(and(eq(orders.id, orderId), eq(orders.status, "pending")));
      return NextResponse.json(
        { error: err.message ?? "결제 승인에 실패했어요." },
        { status: 402 },
      );
    }
  }

  // 승인 성공 → 리포트 발급 (사주 계산 스냅샷 포함)
  // 번들이면 포함 상품 각각의 리포트를 발급하고, 대표 토큰은 첫 상품 것으로.
  const persons = (order.inputData as { persons: PersonInput[] }).persons;
  const sajuData =
    persons.length === 2
      ? persons.map((p) => computeAll(p))
      : computeAll(persons[0]);

  const product = getProduct(order.productCode);
  const reportCodes = product?.bundleCodes ?? [order.productCode];
  const tokens = reportCodes.map(() => nanoid(24));

  await db.transaction(async (tx) => {
    for (let i = 0; i < reportCodes.length; i++) {
      await tx.insert(reports).values({
        token: tokens[i],
        orderId,
        productCode: reportCodes[i],
        inputData: { persons },
        sajuData,
        status: "pending",
      });
    }
    await tx
      .update(orders)
      .set({ status: "paid", paymentKey, reportToken: tokens[0], approvedAt: new Date() })
      .where(eq(orders.id, orderId));
  });

  return NextResponse.json({ token: tokens[0] });
}

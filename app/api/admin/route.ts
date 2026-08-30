import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { after, NextResponse } from "next/server";
import { lookupCoupon, redeemCoupon } from "@/lib/coupons";
import { getDb, orders, reports } from "@/lib/db";
import { sendReportLinks } from "@/lib/email";
import { getPricing } from "@/lib/pricing";
import { getProduct } from "@/lib/products";
import { computeAll } from "@/lib/saju/compute";
import { siteUrl } from "@/lib/site";
import { parseEmail, parsePersonInput } from "@/lib/validate";
import type { PersonInput } from "@/lib/saju/types";

// 운영자 콘솔 API — 당근 등 채팅 채널에서 받은 주문을 직접 발급한다.
// 보호: ADMIN_KEY 헤더. (프로덕션에서도 동작해야 하므로 dev 라우트와 별개)
export const runtime = "nodejs";

function denied(req: Request): NextResponse | null {
  const key = process.env.ADMIN_KEY;
  if (!key) {
    return NextResponse.json({ error: "ADMIN_KEY가 설정되지 않았어요." }, { status: 500 });
  }
  if (req.headers.get("x-admin-key") !== key) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(req: Request) {
  const no = denied(req);
  if (no) return no;

  const body = (await req.json()) as {
    action: "issue" | "list" | "coupon";
    productCode?: string;
    persons?: unknown[];
    /** paid = 입금 완료된 실판매(주문 생성, 후기에 "구매 확인됨"), tester = 체험단 무상 */
    kind?: "paid" | "tester";
    channel?: string; // "당근" 등 유입 경로 메모
    amount?: number; // 실제 입금액 (미지정 시 현재 단계 가격)
    email?: unknown; // 있으면 발급 즉시 리포트 링크 메일 발송
    q?: string; // list 전용 — 이름/입금자명 검색
    limit?: number; // list 전용
    code?: string; // coupon 전용
    redeem?: boolean; // coupon 전용 — true면 사용 처리까지
    note?: string; // coupon 전용 — 누구에게 썼는지 메모
  };
  const db = getDb();

  // 후기 리워드 쿠폰 확인/사용 — 당근 채팅으로 코드를 받았을 때 여기서 조회한다
  if (body.action === "coupon") {
    const found = await lookupCoupon(body.code ?? "");
    if (found.status !== "valid" || !body.redeem) {
      return NextResponse.json(found);
    }
    const ok = await redeemCoupon(body.code ?? "", body.note ?? "");
    return ok
      ? NextResponse.json({ status: "redeemed", code: found.code, benefit: found.benefit })
      : NextResponse.json({ status: "used", code: found.code, benefit: found.benefit });
  }

  if (body.action === "list") {
    // 계좌이체 주문은 입금자명으로 찾아야 하므로 검색이 필수고,
    // 30건은 이틀치라 문의가 몰리면 바로 넘친다. 기본 60 / 최대 200.
    const limit = Math.min(200, Math.max(1, Number(body.limit) || 60));
    const rows = await db
      .select({
        token: reports.token,
        productCode: reports.productCode,
        status: reports.status,
        orderId: reports.orderId,
        inputData: reports.inputData,
        createdAt: reports.createdAt,
        amount: orders.amount,
        email: orders.email,
        paymentKey: orders.paymentKey,
      })
      .from(reports)
      .leftJoin(orders, eq(reports.orderId, orders.id))
      .orderBy(desc(reports.createdAt))
      .limit(limit);

    const q = (body.q ?? "").trim().toLowerCase();
    const items = rows
      .map((r) => ({
        token: r.token,
        productCode: r.productCode,
        status: r.status,
        isPaid: Boolean(r.orderId),
        name: (r.inputData as { persons: PersonInput[] })?.persons?.[0]?.name ?? "",
        amount: r.amount ?? null,
        email: r.email ?? null,
        // "manual:당근" → "당근". 어느 경로로 들어온 주문인지 한눈에.
        channel: r.paymentKey?.startsWith("manual:") ? r.paymentKey.slice(7) : null,
        createdAt: r.createdAt,
      }))
      .filter(
        (it) =>
          !q ||
          it.name.toLowerCase().includes(q) ||
          it.token.toLowerCase().includes(q) ||
          (it.email ?? "").toLowerCase().includes(q),
      );
    return NextResponse.json({ items });
  }

  if (body.action !== "issue") {
    return NextResponse.json({ error: "bad action" }, { status: 400 });
  }

  const product = getProduct(body.productCode ?? "");
  if (!product) return NextResponse.json({ error: "존재하지 않는 상품이에요." }, { status: 400 });

  const persons: PersonInput[] = [];
  for (const raw of body.persons ?? []) {
    const p = parsePersonInput(raw);
    if (!p) return NextResponse.json({ error: "입력값을 확인해주세요." }, { status: 400 });
    persons.push(p);
  }
  if (persons.length !== product.personCount) {
    return NextResponse.json({ error: "입력 인원이 맞지 않아요." }, { status: 400 });
  }

  let sajuData: unknown;
  try {
    sajuData = product.personCount === 2 ? persons.map((p) => computeAll(p)) : computeAll(persons[0]);
  } catch {
    return NextResponse.json(
      { error: "지원하지 않는 날짜예요 (1900~2050)." },
      { status: 400 },
    );
  }

  // 번들이면 포함 상품별로 리포트를 각각 발급
  const reportCodes = product.bundleCodes ?? [product.code];
  const tokens = reportCodes.map(() => nanoid(24));

  // 당근 고객은 이메일을 안 주는 경우가 많다 — 선택값으로 두고, 있으면 링크를 보낸다.
  const email = parseEmail(body.email);

  // 실판매면 주문 행도 만든다 — 후기 "구매 확인됨" 라벨, 판매 카운터, 매출 집계의 근거
  let orderId: string | null = null;
  if (body.kind === "paid") {
    const pricing = await getPricing();
    orderId = `ord_${nanoid(18)}`;
    await db.insert(orders).values({
      id: orderId,
      productCode: product.code,
      amount: body.amount ?? pricing.prices[product.code].current,
      status: "paid",
      paymentKey: `manual:${body.channel ?? "직접"}`,
      inputData: { persons },
      reportToken: tokens[0],
      approvedAt: new Date(),
      email,
    });
  }

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
  });

  if (email) {
    const base = siteUrl();
    const links = reportCodes.map((code, i) => ({
      label: getProduct(code)?.name ?? "리포트",
      url: `${base}/report/${tokens[i]}`,
    }));
    after(async () => {
      await sendReportLinks({
        to: email,
        name: persons[0].name || "고객",
        productName: product.name,
        links,
      });
    });
  }

  return NextResponse.json({ tokens, orderId, emailed: Boolean(email) });
}

export async function GET(req: Request) {
  const no = denied(req);
  if (no) return no;
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const rows = await getDb()
    .select({ status: reports.status, content: reports.content })
    .from(reports)
    .where(eq(reports.token, token))
    .limit(1);
  if (!rows.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  const raw = (rows[0].content as { rawText?: string } | null)?.rawText ?? "";
  return NextResponse.json({ status: rows[0].status, length: raw.length });
}

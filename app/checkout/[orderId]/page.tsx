import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import TossCheckout from "@/components/TossCheckout";
import { getDb, orders } from "@/lib/db";
import { getProduct } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const rows = await getDb().select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = rows[0];
  if (!order) notFound();

  // 이미 결제된 주문 → 리포트로
  if (order.status === "paid" && order.reportToken) {
    redirect(`/report/${order.reportToken}`);
  }

  const product = getProduct(order.productCode);
  if (!product) notFound();

  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  if (!clientKey) {
    return (
      <div className="mx-auto max-w-[430px] px-5 py-16 text-center text-sm text-ink-soft">
        결제 설정이 아직 완료되지 않았어요. (NEXT_PUBLIC_TOSS_CLIENT_KEY 미설정)
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[430px] px-5 py-8">
      <header className="text-center">
        <p className="text-xs tracking-widest text-ink-soft">STEP 2 / 2 — 결제</p>
        <h1 className="mt-1 text-xl font-bold">{product.name}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {/* 서비스 제공기간 고지 — PG 심사 요건이자 원칙 1(실측 이하 표기): deep 실측 12~13분 */}
          결제가 완료되면 바로 리포트 생성이 시작돼요 (
          {product.code === "deep" ? "약 15분 이내" : "약 1~2분"})
        </p>
      </header>
      {/* 토스 결제위젯은 흰 DOM을 그리므로 카드 자체를 종이로 — 결제 로직은 그대로 */}
      <div className="paper mt-6 rounded-2xl border border-line bg-card p-2">
        <TossCheckout
          clientKey={clientKey}
          orderId={order.id}
          orderName={product.name}
          amount={order.amount}
        />
      </div>
    </div>
  );
}

import ConfirmPayment from "@/components/ConfirmPayment";

export const dynamic = "force-dynamic";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentKey?: string; orderId?: string; amount?: string }>;
}) {
  const { paymentKey, orderId, amount } = await searchParams;

  if (!paymentKey || !orderId || !amount) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center text-sm text-ink-soft">
        결제 정보가 올바르지 않아요.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-24">
      <ConfirmPayment paymentKey={paymentKey} orderId={orderId} amount={amount} />
    </div>
  );
}

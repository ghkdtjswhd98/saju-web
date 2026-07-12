import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PaymentFailPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; message?: string }>;
}) {
  const { message } = await searchParams;
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="text-lg font-bold">결제가 완료되지 않았어요</h1>
      <p className="mt-2 text-sm text-ink-soft">{message ?? "결제가 취소되었거나 실패했어요."}</p>
      <Link
        href="/products"
        className="mt-6 inline-block rounded-xl border border-line bg-card px-5 py-3 text-sm font-medium hover:border-accent"
      >
        상품 목록으로 돌아가기
      </Link>
    </div>
  );
}

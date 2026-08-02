import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import CheckoutForm from "@/components/CheckoutForm";
import type { PersonFormValue } from "@/components/PersonFields";
import { getDb, reports } from "@/lib/db";
import { getProduct } from "@/lib/products";
import type { PersonInput } from "@/lib/saju/types";

export const dynamic = "force-dynamic";

function toFormValue(person: PersonInput): Partial<PersonFormValue> {
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    name: person.name,
    gender: person.gender,
    calendar: person.isLunar ? "음력" : "양력",
    isLeap: person.isLeap,
    date: `${person.year}-${pad(person.month)}-${pad(person.day)}`,
    hourValue: person.hourValue,
  };
}

// 무료 결과(from=shareId)에서 넘어온 경우 입력값 프리필 (궁합 티저면 2인 모두)
async function getPrefill(
  fromToken: string | undefined,
): Promise<Partial<PersonFormValue>[] | null> {
  if (!fromToken) return null;
  try {
    const rows = await getDb()
      .select({ inputData: reports.inputData })
      .from(reports)
      .where(eq(reports.token, fromToken))
      .limit(1);
    const persons = (rows[0]?.inputData as { persons: PersonInput[] } | undefined)?.persons;
    if (!persons?.length) return null;
    return persons.map(toFormValue);
  } catch {
    return null;
  }
}

export default async function CheckoutNewPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; from?: string }>;
}) {
  const { product: productCode, from } = await searchParams;
  const product = getProduct(productCode ?? "");
  if (!product) notFound();

  const prefill = await getPrefill(from);

  return (
    <div className="mx-auto max-w-xl px-5 py-8">
      <header className="text-center">
        <p className="text-xs tracking-widest text-ink-soft">STEP 1 / 2 — 정보 입력</p>
        <h1 className="mt-1 text-xl font-bold">{product.name}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {product.tagline} · <b className="text-accent-strong">{product.price.toLocaleString()}원</b>
        </p>
      </header>
      <div className="mt-6">
        <CheckoutForm product={product} prefill={prefill} />
      </div>
    </div>
  );
}

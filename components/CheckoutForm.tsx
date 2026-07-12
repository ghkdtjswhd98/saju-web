"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/lib/products";
import PersonFields, { EMPTY_PERSON, personToApiInput, type PersonFormValue } from "./PersonFields";

interface Props {
  product: Product;
  prefill?: Partial<PersonFormValue> | null; // 무료 결과에서 넘어온 경우
}

export default function CheckoutForm({ product, prefill }: Props) {
  const router = useRouter();
  const [persons, setPersons] = useState<PersonFormValue[]>(() => {
    const first = { ...EMPTY_PERSON, ...(prefill ?? {}) };
    return product.personCount === 2 ? [first, { ...EMPTY_PERSON }] : [first];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    for (const p of persons) {
      if (!p.date) {
        setError("생년월일을 모두 입력해주세요.");
        return;
      }
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productCode: product.code,
          persons: persons.map(personToApiInput),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "잠시 후 다시 시도해주세요.");
        return;
      }
      router.push(`/checkout/${data.orderId}`);
    } catch {
      setError("네트워크 오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  const labels = product.personCount === 2 ? ["나의 정보", "상대의 정보"] : [null];

  return (
    <div className="space-y-5">
      {persons.map((p, i) => (
        <div key={i} className="rounded-2xl border border-line bg-card p-5">
          {labels[i] && (
            <h2 className="mb-4 text-sm font-bold tracking-widest text-accent-strong">{labels[i]}</h2>
          )}
          <PersonFields
            value={p}
            onChange={(v) => setPersons((arr) => arr.map((x, j) => (j === i ? v : x)))}
            namePlaceholder={i === 1 ? "상대 이름 (또는 별칭)" : undefined}
          />
        </div>
      ))}
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="w-full rounded-xl bg-accent-strong px-4 py-3.5 text-[15px] font-bold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "주문 준비 중..." : "결제 단계로"}
      </button>
    </div>
  );
}

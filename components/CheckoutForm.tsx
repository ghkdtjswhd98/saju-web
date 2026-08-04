"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/products";
import PersonFields, { EMPTY_PERSON, personToApiInput, type PersonFormValue } from "./PersonFields";

interface Props {
  product: Product;
  prefill?: Partial<PersonFormValue>[] | null; // 무료 결과에서 넘어온 경우 (궁합이면 2인)
}

export default function CheckoutForm({ product, prefill }: Props) {
  const router = useRouter();
  const [persons, setPersons] = useState<PersonFormValue[]>(() =>
    Array.from({ length: product.personCount }, (_, i) => ({
      ...EMPTY_PERSON,
      ...(prefill?.[i] ?? {}),
    })),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 무료 결과를 본 적 있는데 from 파라미터 없이 들어온 경우(상품 페이지 경유) —
  // 같은 정보 재입력이 최대 이탈 지점이라, 저장해둔 shareId로 프리필 경로를 제안
  const [lastFreeId, setLastFreeId] = useState<string | null>(null);
  useEffect(() => {
    if (prefill?.length) return;
    try {
      setLastFreeId(localStorage.getItem("orobmi_last_free"));
    } catch {
      /* private 모드 등 */
    }
  }, [prefill]);

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
      {lastFreeId && (
        <a
          href={`/checkout/new?product=${product.code}&from=${lastFreeId}`}
          className="block rounded-xl border border-accent bg-accent-soft/40 px-4 py-3 text-center text-sm font-medium text-accent-strong transition hover:bg-accent-soft/70"
        >
          ⚡ 무료 사주에서 입력한 내 정보 그대로 불러오기
        </a>
      )}
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
      <p className="text-center text-xs text-ink-soft">
        🔒 결제는 토스페이먼츠 안전결제로 진행돼요. 카드 정보는 저희에게 저장되지 않아요.
      </p>
    </div>
  );
}

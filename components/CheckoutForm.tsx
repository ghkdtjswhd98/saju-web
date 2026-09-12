"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/products";
import Icon from "./icons";
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
  // 리포트 링크를 잃었을 때 재발송할 유일한 경로 — 브라우저에 기억시켜 재입력 마찰을 줄인다
  const [email, setEmail] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("orobmi_email");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 1회 localStorage 읽기(외부 시스템 동기화), 캐스케이드 없음
      if (saved) setEmail(saved);
    } catch {
      /* private 모드 등 */
    }
  }, []);
  // 무료 결과를 본 적 있는데 from 파라미터 없이 들어온 경우(상품 페이지 경유) —
  // 같은 정보 재입력이 최대 이탈 지점이라, 저장해둔 shareId로 프리필 경로를 제안
  const [lastFreeId, setLastFreeId] = useState<string | null>(null);
  useEffect(() => {
    if (prefill?.length) return;
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 1회 localStorage 읽기(외부 시스템 동기화), 캐스케이드 없음
      setLastFreeId(localStorage.getItem("orobmi_last_free"));
    } catch {
      /* private 모드 등 */
    }
  }, [prefill]);

  async function submit() {
    for (const p of persons) {
      if (!p.gender) {
        setError("성별을 선택해주세요.");
        return;
      }
      if (!p.date) {
        setError("생년월일을 모두 입력해주세요.");
        return;
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("리포트를 보내드릴 이메일 주소를 정확히 입력해주세요.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      try {
        localStorage.setItem("orobmi_email", email.trim());
      } catch {
        /* private 모드 등 */
      }
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productCode: product.code,
          persons: persons.map(personToApiInput),
          email: email.trim(),
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
          <Icon name="bolt" /> 무료 사주에서 입력한 내 정보 그대로 불러오기
        </a>
      )}
      {persons.map((p, i) => (
        <div key={i} className="rounded-2xl border border-line bg-card p-5">
          {labels[i] && (
            <h2 className="mb-4 text-sm font-bold tracking-widest text-accent-strong">{labels[i]}</h2>
          )}
          {/* 상황·고민 질문은 신청자(첫 번째 사람)에게만 — 상대 것까지 물으면 마찰만 는다 */}
          <PersonFields
            value={p}
            onChange={(v) => setPersons((arr) => arr.map((x, j) => (j === i ? v : x)))}
            namePlaceholder={i === 1 ? "상대 이름 (또는 별칭)" : undefined}
            withExtras={i === 0}
            withConcern={i === 0}
          />
        </div>
      ))}
      {/* 링크 유실 대비 — 이게 없으면 리포트를 잃은 고객에게 다시 보낼 방법이 없다 */}
      <div className="rounded-2xl border border-line bg-card p-5">
        <label className="text-sm font-bold" htmlFor="orobmi-email">
          리포트 받을 이메일
        </label>
        <input
          id="orobmi-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="orobmi@example.com"
          className="mt-2 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
        <p className="mt-1.5 text-xs leading-5 text-ink-soft">
          리포트 링크를 이 주소로도 보내드려요. 링크를 잃어버려도 다시 찾을 수 있어요.
          <br />
          광고 메일은 보내지 않아요.
        </p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="w-full rounded-xl bg-[#272132] px-4 py-3.5 text-[15px] font-bold text-[#FFE9A8] transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "주문 준비 중..." : "결제 단계로"}
      </button>
      <p className="text-center text-xs text-ink-soft">
        <Icon name="lock" size={12} /> 결제는 토스페이먼츠 안전결제로 진행돼요. 카드 정보는 저희에게 저장되지 않아요.
      </p>
    </div>
  );
}

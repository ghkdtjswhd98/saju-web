"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { trackPixel } from "@/components/MetaPixel";

interface Props {
  paymentKey: string;
  orderId: string;
  amount: string;
}

// success 리다이렉트 후 서버 승인 호출 → 리포트로 이동
export default function ConfirmPayment({ paymentKey, orderId, amount }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return; // StrictMode 중복 호출 방지 (서버도 멱등이지만 이중 안전)
    called.current = true;
    (async () => {
      try {
        const res = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "결제 승인에 실패했어요.");
          return;
        }
        trackPixel("Purchase", { value: Number(amount), currency: "KRW" });
        router.replace(`/report/${data.token}`);
      } catch {
        setError("네트워크 오류가 발생했어요. 새로고침 해주세요.");
      }
    })();
  }, [paymentKey, orderId, amount, router]);

  if (error) {
    return (
      <div className="text-center">
        <p className="text-sm text-danger">{error}</p>
        <p className="mt-2 text-xs text-ink-soft">
          결제가 되었는데 이 화면이 보인다면 새로고침 해주세요. 문제가 계속되면 문의 부탁드려요.
        </p>
      </div>
    );
  }
  return (
    <div className="text-center">
      <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-accent" />
      <p className="mt-3 text-sm text-ink-soft">결제를 확인하는 중이에요…</p>
    </div>
  );
}

"use client";

import { ANONYMOUS, loadTossPayments, type TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";
import { useEffect, useRef, useState } from "react";

interface Props {
  clientKey: string;
  orderId: string;
  orderName: string;
  amount: number;
}

export default function TossCheckout({ clientKey, orderId, orderName, amount }: Props) {
  const widgetsRef = useRef<TossPaymentsWidgets | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tossPayments = await loadTossPayments(clientKey);
        const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });
        await widgets.setAmount({ currency: "KRW", value: amount });
        if (cancelled) return;
        await Promise.all([
          widgets.renderPaymentMethods({ selector: "#payment-method", variantKey: "DEFAULT" }),
          widgets.renderAgreement({ selector: "#agreement", variantKey: "AGREEMENT" }),
        ]);
        if (cancelled) return;
        widgetsRef.current = widgets;
        setReady(true);
      } catch (e) {
        console.error(e);
        setError("결제 모듈을 불러오지 못했어요. 새로고침 해주세요.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientKey, orderId, amount]);

  async function pay() {
    if (!widgetsRef.current) return;
    try {
      await widgetsRef.current.requestPayment({
        orderId,
        orderName,
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/fail`,
      });
    } catch (e) {
      // 사용자가 결제창을 닫은 경우 등 — 조용히 무시
      console.warn(e);
    }
  }

  return (
    <div>
      <div id="payment-method" />
      <div id="agreement" />
      {error && <p className="px-2 text-sm text-danger">{error}</p>}
      <button
        type="button"
        onClick={pay}
        disabled={!ready}
        className="mt-4 w-full rounded-xl bg-accent-strong px-4 py-3.5 text-[15px] font-bold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {amount.toLocaleString()}원 결제하기
      </button>
    </div>
  );
}

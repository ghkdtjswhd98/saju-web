"use client";

import {
  ANONYMOUS,
  loadTossPayments,
  type TossPaymentsPayment,
  type TossPaymentsWidgets,
} from "@tosspayments/tosspayments-sdk";
import { useEffect, useRef, useState } from "react";

interface Props {
  clientKey: string;
  orderId: string;
  orderName: string;
  amount: number;
}

// 키 종류로 연동 방식을 고른다 (2026-09-09 토스 심사 대응):
//  - 결제위젯 연동 키(…_gck_…) → 결제위젯(결제수단 UI를 페이지 안에 렌더)
//  - API 개별 연동 키(…_ck_…)  → 결제창(버튼을 누르면 토스 통합결제창이 열림)
// 개발자센터에서 상점 전용으로 바로 받을 수 있는 키가 API 개별 연동 키뿐인 경우가 있어 둘 다 지원한다.
function integrationMode(clientKey: string): "widget" | "window" {
  return /_gck_/.test(clientKey) ? "widget" : "window";
}

export default function TossCheckout({ clientKey, orderId, orderName, amount }: Props) {
  const mode = integrationMode(clientKey);
  const widgetsRef = useRef<TossPaymentsWidgets | null>(null);
  const paymentRef = useRef<TossPaymentsPayment | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tossPayments = await loadTossPayments(clientKey);
        if (cancelled) return;
        if (mode === "window") {
          paymentRef.current = tossPayments.payment({ customerKey: ANONYMOUS });
          setReady(true);
          return;
        }
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
  }, [clientKey, orderId, amount, mode]);

  async function pay() {
    const successUrl = `${window.location.origin}/payments/success`;
    const failUrl = `${window.location.origin}/payments/fail`;
    try {
      if (mode === "window") {
        if (!paymentRef.current) return;
        await paymentRef.current.requestPayment({
          method: "CARD",
          amount: { currency: "KRW", value: amount },
          orderId,
          orderName,
          successUrl,
          failUrl,
          card: { useEscrow: false, flowMode: "DEFAULT", useCardPoint: false, useAppCardOnly: false },
        });
        return;
      }
      if (!widgetsRef.current) return;
      await widgetsRef.current.requestPayment({ orderId, orderName, successUrl, failUrl });
    } catch (e) {
      // 사용자가 결제창을 닫은 경우 등 — 조용히 무시
      console.warn(e);
    }
  }

  return (
    <div>
      {mode === "widget" ? (
        <>
          <div id="payment-method" />
          <div id="agreement" />
        </>
      ) : (
        <div className="px-2 py-3 text-sm leading-6 text-ink-soft">
          <p>
            <b className="text-ink">결제 수단:</b> 신용·체크카드, 카카오페이·네이버페이 등 간편결제
          </p>
          <p>아래 버튼을 누르면 토스페이먼츠 결제창이 열려요. 결제 완료 후 이 사이트로 자동으로 돌아옵니다.</p>
        </div>
      )}
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

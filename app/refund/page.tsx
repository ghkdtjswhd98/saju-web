import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "환불정책" };

const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: "환불이 가능한 경우 (전액 환불)",
    p: [
      "결제는 완료되었으나 시스템 오류로 리포트가 생성되지 않은 경우",
      "리포트 링크가 유실·손상되어 열람이 불가능하고 복구가 안 되는 경우",
      "동일 주문이 중복 결제된 경우 (중복분 환불)",
      "입력하신 생년월일 기준으로 계산된 사주 명식(팔자)이 실제와 다르게 산출된 오류가 확인된 경우",
    ],
  },
  {
    h: "환불이 어려운 경우",
    p: [
      "리포트가 정상적으로 생성·열람된 후의 단순 변심: 유료 리포트는 입력 정보를 바탕으로 즉시 개별 생성되는 맞춤형 디지털 콘텐츠로, 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항 제5호에 따라 청약철회가 제한됩니다. 이 사실은 결제 전 상품 페이지에 고지됩니다.",
      "이용자가 생년월일시를 잘못 입력하여 발생한 결과 (결제 전 입력 정보를 꼭 확인해주세요. 다만 이 경우에도 1회에 한해 올바른 정보로 재생성을 도와드립니다 — 아래로 문의 주세요)",
    ],
  },
  {
    h: "환불 절차",
    p: [
      `문의: ${SITE.email} 로 주문번호(또는 리포트 링크)와 사유를 보내주세요.`,
      "확인 후 3영업일 이내에 결제수단으로 환불 처리됩니다 (카드 결제 취소는 카드사 사정에 따라 3~7영업일 소요될 수 있습니다).",
    ],
  },
];

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <h1 className="text-xl font-bold">환불정책</h1>
      <div className="mt-6 space-y-6">
        {SECTIONS.map((s) => (
          <section key={s.h}>
            <h2 className="text-[15px] font-bold">{s.h}</h2>
            <ul className="mt-1.5 space-y-1.5">
              {s.p.map((t, i) => (
                <li key={i} className="text-sm leading-6 text-ink-soft">
                  · {t}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

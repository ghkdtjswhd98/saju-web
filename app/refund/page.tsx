import type { Metadata } from "next";
import RefundRequestForm from "@/components/RefundRequestForm";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "환불정책" };

const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: "결과가 만족스럽지 않으면 환불해드립니다",
    p: [
      "리포트를 다 읽어보신 뒤에도 만족스럽지 않으셨다면, 어떤 점이 부족했는지 알려주세요. 확인 후 환불해드립니다.",
      "법적으로는 이렇게까지 안 해도 됩니다. 맞춤 제작되는 디지털 콘텐츠는 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항 제5호에 따라 열람 후 청약철회가 제한되거든요. 그래도 이렇게 하는 이유는, 부족했던 점을 들어야 다음 리포트를 고칠 수 있기 때문입니다.",
      "그래서 사유를 여쭙습니다. 심사하려는 게 아니라 고치려고 묻는 거예요. 짧아도 좋으니 구체적으로 적어주시면 가장 도움이 됩니다.",
    ],
  },
  {
    h: "사유를 묻지 않고 바로 환불하는 경우",
    p: [
      "결제는 됐는데 시스템 오류로 리포트가 생성되지 않은 경우",
      "리포트 링크가 유실·손상되어 열람이 불가능하고 복구도 안 되는 경우",
      "같은 주문이 중복 결제된 경우 (중복분 환불)",
      "입력하신 생년월일시로 계산된 사주 명식(팔자)이 잘못 산출된 오류가 확인된 경우",
      "리포트 생성이 시작되기 전(링크를 아직 열지 않은 상태)에 취소를 요청하신 경우",
    ],
  },
  {
    h: "환불이 어려운 경우",
    p: [
      "생년월일시를 잘못 입력하신 경우 — 다만 이때도 1회에 한해 올바른 정보로 다시 만들어드립니다. 환불보다 이쪽이 나으실 거예요. 아래로 알려주세요.",
      "리포트를 받지 않은 상태에서의 반복적인 환불 요청 등 명백한 악용",
    ],
  },
  {
    h: "환불 절차",
    p: [
      "아래 폼으로 접수하시거나, 당근 채팅으로 알려주세요.",
      `메일도 됩니다: ${SITE.email} (주문번호 또는 리포트 링크와 함께)`,
      "확인 후 3영업일 이내에 결제수단으로 환불해드립니다. 카드 취소는 카드사 사정에 따라 3~7영업일이 걸릴 수 있어요. 계좌이체로 결제하신 경우 알려주신 계좌로 보내드립니다.",
    ],
  },
];

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-[430px] px-5 py-10">
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
      {/* 접수 폼은 종이 카드 */}
      <div className="paper mt-8">
        <RefundRequestForm />
      </div>
    </div>
  );
}

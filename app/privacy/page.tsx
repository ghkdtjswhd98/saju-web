import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "개인정보처리방침" };

const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: "1. 수집하는 개인정보 항목",
    p: [
      "무료·유료 서비스 공통: 이름(또는 별칭), 성별, 생년월일, 태어난 시간(선택). 궁합 서비스의 경우 상대방의 동일 정보가 추가로 입력됩니다.",
      "유료 결제 시: 결제 승인 정보(주문번호, 결제수단·승인 내역). 카드번호 등 민감한 결제정보는 회사가 저장하지 않으며 전자결제대행사(토스페이먼츠)가 처리합니다.",
      "자동 수집: 서비스 어뷰징 방지를 위한 IP 주소(일 단위 이용 횟수 확인 목적).",
    ],
  },
  {
    h: "2. 개인정보의 이용 목적",
    p: [
      "사주 명식 계산 및 해석 리포트 생성·제공, 결제 처리와 구매 이력 확인, 부정 이용 방지.",
    ],
  },
  {
    h: "3. 처리 위탁",
    p: [
      "리포트 해석 생성: Anthropic (AI 해석 생성을 위해 입력된 생년월일시·성별·계산 결과가 API로 전송됩니다)",
      "결제 처리: 토스페이먼츠 (결제 승인·취소)",
      "데이터 보관: Supabase (데이터베이스 호스팅)",
    ],
  },
  {
    h: "4. 보유 및 파기",
    p: [
      "무료 결과는 생성일부터 1년, 유료 리포트는 이용자의 재열람을 위해 구매일부터 5년(전자상거래법상 계약·대금결제 기록 보존 기간) 보관 후 파기합니다.",
      "이용자는 언제든지 아래 이메일로 본인 정보(리포트 포함) 삭제를 요청할 수 있으며, 회사는 지체 없이 파기합니다.",
    ],
  },
  {
    h: "5. 이용자의 권리",
    p: [
      "이용자는 개인정보 열람·정정·삭제·처리정지를 요청할 수 있습니다. 서비스는 회원 계정을 운영하지 않으므로, 요청 시 리포트 링크 또는 결제 정보로 본인 확인 후 처리합니다.",
    ],
  },
  {
    h: "6. 개인정보 보호책임자",
    p: [
      `책임자: ${SITE.ownerName} / 문의: ${SITE.email}`,
      "이 방침은 2026년 7월부터 적용됩니다.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <h1 className="text-xl font-bold">개인정보처리방침</h1>
      <div className="mt-6 space-y-6">
        {SECTIONS.map((s) => (
          <section key={s.h}>
            <h2 className="text-[15px] font-bold">{s.h}</h2>
            {s.p.map((t, i) => (
              <p key={i} className="mt-1.5 text-sm leading-6 text-ink-soft">
                {t}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

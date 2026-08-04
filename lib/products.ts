// 유료 상품 카탈로그 — 가격의 진실의 원천 (클라이언트가 보낸 금액은 절대 신뢰하지 않는다)
// 실제 판매 가격은 lib/pricing.ts의 단계 인상제로 계산된다 (openPrice → listPrice).

export type ProductCode = "lifetime" | "love" | "year" | "career" | "bundle" | "deep";

export interface Product {
  code: ProductCode;
  name: string;
  tagline: string;
  openPrice: number; // 오픈 특가 (시작가)
  listPrice: number; // 정가 (단계 인상 상한)
  personCount: 1 | 2;
  sections: string[]; // 리포트 목차 (상품 페이지 노출용)
  bundleCodes?: ProductCode[]; // 번들이면 포함 상품
  // 비대면 사주는 실물이 없어 "분량"이 유일한 품질 시그널 — 상위 판매자 전원이 페이지 수를
  // 전면에 내건다(52페이지/150페이지 등). 실측값만 표기한다.
  pdfPages: number;
  charCount: string; // 실측 자수 범위
}

export const PRODUCTS: Record<ProductCode, Product> = {
  // 가격 사다리 상단 — 당근 상위 판매자(2~4.5만원, 100~170페이지)와 같은 링에 서는 상품.
  // 2026-08-05 실측: 명리학도 사주박사 35,000원(후기 2,741), 사주대가 29,900원(후기 3,018),
  // 명리심리연구소 20,000원(후기 2,568). 우리는 같은 깊이를 1~2분 만에 준다.
  deep: {
    code: "deep",
    name: "정통 심층사주 (프리미엄)",
    tagline: "10년 단위 대운까지 한 장씩, 평생 한 번 제대로 보는 사주",
    openPrice: 19900,
    listPrice: 29900,
    personCount: 1,
    sections: [
      "인생 총평", "타고난 기질", "숨은 재능", "재물운", "직업운", "연애·결혼운",
      "건강운", "인간관계", "대운 10년별 흐름", "올해와 내년", "인생의 전환점", "실천 조언",
    ],
    pdfPages: 32,
    charCount: "20,000자",
  },
  bundle: {
    code: "bundle",
    name: "풀패키지 (종합+올해+직업 3종)",
    tagline: "나의 전체 설계도부터 올해의 타이밍까지, 한 번에 전부",
    openPrice: 17900,
    listPrice: 24900,
    personCount: 1,
    sections: ["평생사주 종합 리포트", "올해 운세 리포트", "직업·재물운 리포트"],
    bundleCodes: ["lifetime", "year", "career"],
    pdfPages: 26,
    charCount: "16,000자",
  },
  lifetime: {
    code: "lifetime",
    name: "평생사주 종합 리포트",
    tagline: "타고난 기질부터 재물·직업·연애·건강까지, 나의 전체 설계도",
    openPrice: 6900,
    listPrice: 9900,
    personCount: 1,
    sections: ["인생 총평", "타고난 기질", "재물운", "직업운", "연애운", "건강운", "인생 국면별 흐름", "실천 조언"],
    pdfPages: 10,
    charCount: "6,000자",
  },
  love: {
    code: "love",
    name: "연애·궁합 리포트",
    tagline: "두 사람의 사주를 교차 분석한 케미 리포트",
    openPrice: 9900,
    listPrice: 12900,
    personCount: 2,
    sections: ["케미 총평", "나의 연애 스타일", "상대의 연애 스타일", "끌림 포인트", "갈등 포인트", "관계 조언"],
    pdfPages: 8,
    charCount: "4,000자",
  },
  year: {
    code: "year",
    name: "올해 운세 리포트",
    tagline: "올해의 흐름과 월별 리듬, 지금 잡아야 할 타이밍",
    openPrice: 6900,
    listPrice: 9900,
    personCount: 1,
    sections: ["올해 총평", "커리어·재물", "관계·연애", "건강·컨디션", "월별 흐름", "올해의 전략"],
    pdfPages: 8,
    charCount: "4,000자",
  },
  career: {
    code: "career",
    name: "직업·재물운 리포트",
    tagline: "나에게 맞는 일과 재물의 그릇, 커리어의 방향",
    openPrice: 6900,
    listPrice: 9900,
    personCount: 1,
    sections: ["총평", "강점과 재능", "맞는 일과 환경", "재물의 그릇", "올해의 커리어 흐름", "실천 조언"],
    pdfPages: 8,
    charCount: "3,700자",
  },
};

export function getProduct(code: string): Product | null {
  return (PRODUCTS as Record<string, Product>)[code] ?? null;
}

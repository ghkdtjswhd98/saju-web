// 유료 상품 카탈로그 — 가격의 진실의 원천 (클라이언트가 보낸 금액은 절대 신뢰하지 않는다)

export type ProductCode = "lifetime" | "love" | "year" | "career";

export interface Product {
  code: ProductCode;
  name: string;
  tagline: string;
  price: number; // KRW
  personCount: 1 | 2;
  sections: string[]; // 리포트 목차 (상품 페이지 노출용)
}

export const PRODUCTS: Record<ProductCode, Product> = {
  lifetime: {
    code: "lifetime",
    name: "평생사주 종합 리포트",
    tagline: "타고난 기질부터 재물·직업·연애·건강까지, 나의 전체 설계도",
    price: 9900,
    personCount: 1,
    sections: ["인생 총평", "타고난 기질", "재물운", "직업운", "연애운", "건강운", "인생 국면별 흐름", "실천 조언"],
  },
  love: {
    code: "love",
    name: "연애·궁합 리포트",
    tagline: "두 사람의 사주를 교차 분석한 케미 리포트",
    price: 12900,
    personCount: 2,
    sections: ["케미 총평", "나의 연애 스타일", "상대의 연애 스타일", "끌림 포인트", "갈등 포인트", "관계 조언"],
  },
  year: {
    code: "year",
    name: "올해 운세 리포트",
    tagline: "올해의 흐름과 월별 리듬, 지금 잡아야 할 타이밍",
    price: 9900,
    personCount: 1,
    sections: ["올해 총평", "커리어·재물", "관계·연애", "건강·컨디션", "월별 흐름", "올해의 전략"],
  },
  career: {
    code: "career",
    name: "직업·재물운 리포트",
    tagline: "나에게 맞는 일과 재물의 그릇, 커리어의 방향",
    price: 9900,
    personCount: 1,
    sections: ["총평", "강점과 재능", "맞는 일과 환경", "재물의 그릇", "올해의 커리어 흐름", "실천 조언"],
  },
};

export function getProduct(code: string): Product | null {
  return (PRODUCTS as Record<string, Product>)[code] ?? null;
}

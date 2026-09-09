// 유료 상품 카탈로그 — 가격의 진실의 원천 (클라이언트가 보낸 금액은 절대 신뢰하지 않는다)
// 실제 판매 가격은 lib/pricing.ts의 단계 인상제로 계산된다 (openPrice → listPrice).

export type ProductCode =
  | "lifetime" | "love" | "year" | "career" | "bundle" | "deep"
  | "reunion" | "marriage" | "dohwa" | "crush";

export interface Product {
  code: ProductCode;
  name: string;
  // 카드 카테고리 줄에 쓰는 짧은 이름 — app/brand/poster/[code]/route.tsx의 포스터 제목(ARTS)과 동일하게 유지한다.
  // (포스터 생성기가 [code] 라우트로 옮겨져 경로를 맞춤 — 옛 route.tsx는 308 리다이렉트만 남았다)
  // love119 벤치마킹(권고 6): 카테고리는 상품명 전체가 아니라 한눈에 읽히는 2~5자 라벨이어야 한다.
  shortName: string;
  // 카드·목록에서만 쓰는 후킹 제목 (질문형). 결제창·PDF·주문 내역은 name을 유지한다 —
  // 압구정연애박사 벤치마킹(2026-08-27): 기능 설명형보다 감정·질문형 제목이 클릭을 만든다.
  cardTitle: string;
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
    shortName: "정통 심층사주",
    cardTitle: "철학원 안 가도 되는 이유 — 35페이지 심층사주",
    tagline: "10년 단위 대운까지 한 장씩, 평생 한 번 제대로 보는 사주",
    openPrice: 19900,
    listPrice: 29900,
    personCount: 1,
    sections: [
      "먼저 맞혀볼게요", "인생 총평", "타고난 기질", "숨은 재능", "재물운", "직업운", "연애·결혼운",
      "건강운", "인간관계", "대운 10년별 흐름", "올해와 내년", "인생의 전환점", "실천 조언",
    ],
    // 실측(2026-08-31, 데이터 3페이지 추가 레이아웃): 22,963자 / 프리미엄화 2차(챕터·차트·프레임) 후 37쪽 → 광고 35쪽/22,000자.
    // ⚠️ 당근 sale-image의 DANGGEUN.pages는 아직 26 — 당근 게시물 교체 시 함께 올릴 것(실물 초과 제공 상태라 문제는 없음).
    pdfPages: 35,
    charCount: "22,000자",
  },
  bundle: {
    code: "bundle",
    name: "풀패키지 (종합+올해+직업 3종)",
    shortName: "풀패키지",
    cardTitle: "고민하지 말고 전부 — 3종 풀패키지",
    tagline: "나의 전체 설계도부터 올해의 타이밍까지, 한 번에 전부",
    openPrice: 17900,
    listPrice: 24900,
    personCount: 1,
    sections: ["평생사주 종합 리포트", "올해 운세 리포트", "직업·재물운 리포트"],
    bundleCodes: ["lifetime", "year", "career"],
    pdfPages: 44,
    charCount: "13,000자",
  },
  lifetime: {
    code: "lifetime",
    name: "평생사주 종합 리포트",
    shortName: "평생사주",
    cardTitle: "타고난 내 팔자, 전부 펼쳐보기",
    tagline: "타고난 기질부터 재물·직업·연애·건강까지, 나의 전체 설계도",
    openPrice: 6900,
    listPrice: 9900,
    personCount: 1,
    sections: ["인생 총평", "타고난 기질", "재물운", "직업운", "연애운", "건강운", "인생 국면별 흐름", "실천 조언"],
    pdfPages: 16,
    charCount: "6,000자",
  },
  love: {
    code: "love",
    name: "연애·궁합 리포트",
    shortName: "궁합운세",
    cardTitle: "우리 둘, 사주로 보면 몇 점일까?",
    tagline: "두 사람의 사주를 교차 분석한 케미 리포트",
    openPrice: 9900,
    listPrice: 12900,
    personCount: 2,
    sections: ["케미 총평", "나의 연애 스타일", "상대의 연애 스타일", "끌림 포인트", "갈등 포인트", "관계 조언"],
    pdfPages: 13,
    charCount: "3,500자",
  },
  year: {
    code: "year",
    name: "올해 운세 리포트",
    shortName: "올해운세",
    cardTitle: "2026 병오년, 나의 남은 운은?",
    tagline: "올해의 흐름과 월별 리듬, 지금 잡아야 할 타이밍",
    openPrice: 6900,
    listPrice: 9900,
    personCount: 1,
    sections: ["올해 총평", "커리어·재물", "관계·연애", "건강·컨디션", "월별 흐름", "올해의 전략"],
    pdfPages: 14,
    charCount: "3,000자",
  },
  career: {
    code: "career",
    name: "직업·재물운 리포트",
    shortName: "직업·재물운",
    cardTitle: "돈이 붙는 일은 따로 있다던데?",
    tagline: "나에게 맞는 일과 재물의 그릇, 커리어의 방향",
    openPrice: 6900,
    listPrice: 9900,
    personCount: 1,
    sections: ["총평", "강점과 재능", "맞는 일과 환경", "재물의 그릇", "올해의 커리어 흐름", "실천 조언"],
    pdfPages: 13,
    charCount: "3,700자",
  },
  // ── 2026-08-27 확장 4종 — 압구정연애박사 벤치마킹 (같은 엔진, 주제 특화 재포장) ──
  // 자수 실측(2026-08-30): reunion 3,773 / marriage 3,831 / dohwa 3,441 / crush 3,538.
  // 쪽수 실측(2026-09-02, 프리미엄화 2차 레이아웃): 전부 14쪽 → 광고 13쪽. 표기는 항상 실측 이하.
  reunion: {
    code: "reunion",
    name: "재회운세 리포트",
    shortName: "재회운세",
    cardTitle: "헤어진 그 사람, 다시 만날 확률은?",
    tagline: "두 사람의 사주가 말하는 재회 가능성의 구조, 그리고 타이밍",
    openPrice: 12900,
    listPrice: 16900,
    personCount: 2,
    sections: [
      "지금 두 사람의 기운", "상대의 지금 마음결", "재회 가능성의 구조",
      "다시 만난다면 달라져야 할 것", "움직인다면 언제", "마음을 위한 조언",
    ],
    pdfPages: 13,
    charCount: "3,500자",
  },
  marriage: {
    code: "marriage",
    name: "결혼운세 리포트",
    shortName: "결혼운세",
    cardTitle: "나는 언제, 어떤 사람과 결혼할까?",
    tagline: "배우자의 결과 결혼운이 짙어지는 시기를 나이로 짚어주는 리포트",
    openPrice: 12900,
    listPrice: 16900,
    personCount: 1,
    sections: [
      "결혼운 총평", "만나게 될 배우자의 결", "결혼운이 짙어지는 시기",
      "결혼 전 의식할 나의 패턴", "올해의 인연운", "실천 조언",
    ],
    pdfPages: 13,
    charCount: "3,500자",
  },
  dohwa: {
    code: "dohwa",
    name: "도화살 리포트",
    shortName: "도화살",
    cardTitle: "내 사주에 도화살, 정말 있을까?",
    tagline: "만세력이 판정한 나의 도화살 — 있으면 쓰는 법, 없으면 나만의 매력 구조",
    openPrice: 9900,
    listPrice: 12900,
    personCount: 1,
    sections: [
      "판정 결과", "나의 매력 구조", "매력이 빛나는 순간과 그늘",
      "연애에서의 도화", "올해의 이성운", "실천 조언",
    ],
    pdfPages: 13,
    charCount: "3,000자",
  },
  crush: {
    code: "crush",
    name: "짝사랑·썸 리포트",
    shortName: "속마음운세",
    cardTitle: "그 사람도 나를 생각하고 있을까?",
    tagline: "두 사람의 기운 교차로 읽는 지금의 온도, 다가가는 타이밍",
    openPrice: 9900,
    listPrice: 12900,
    personCount: 2,
    sections: [
      "지금 두 사람의 온도", "상대가 나를 보는 결", "끌림의 구조",
      "머뭇거리게 만드는 것", "다가간다면 어떻게, 언제", "마음을 위한 조언",
    ],
    pdfPages: 13,
    charCount: "3,000자",
  },
};

export function getProduct(code: string): Product | null {
  return (PRODUCTS as Record<string, Product>)[code] ?? null;
}

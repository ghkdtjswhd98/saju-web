// 유료 상품 카탈로그 — 가격의 진실의 원천 (클라이언트가 보낸 금액은 절대 신뢰하지 않는다)
// 실제 판매 가격은 lib/pricing.ts의 단계 인상제로 계산된다 (openPrice → listPrice).

export type ProductCode =
  | "lifetime" | "love" | "year" | "career" | "bundle" | "deep"
  | "reunion" | "marriage" | "dohwa" | "crush";

// 상세 v2 챕터 카드 — sections 항목 하나당 하나. 질문은 "이 챕터가 답하는 것" 2~3줄(확정 예언·부정 라벨 금지).
// 2026-09-02 티저 카피(옛 lib/product-teasers.ts)를 이쪽으로 옮겨 재사용했다 — 첫 질문이 그 티저 제목.
export interface Chapter {
  title: string; // sections의 항목명과 동일
  questions: string[]; // 2~3개
}

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
  // 상세 v2 히어로 헤드라인 — 질문형 2줄(\n으로 줄바꿈). 타이트사주 벤치마킹(2026-09-13): 히어로는 한 질문으로 연다.
  heroQuestion: string;
  // 상세 v2 감성 한 줄 ×2 — 그림 없이 타이포로만 놓이는 문장이라 짧게, 단정 대신 여운.
  moments: [string, string];
  tagline: string;
  openPrice: number; // 오픈 특가 (시작가)
  listPrice: number; // 정가 (단계 인상 상한)
  personCount: 1 | 2;
  sections: string[]; // 리포트 목차 (상품 페이지 노출용)
  chapters: Chapter[]; // sections와 같은 순서·개수 (products.test.ts가 검증)
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
    heroQuestion: "철학원 안 가도,\n제대로 볼 수 있을까?",
    moments: ["평생 한 번은, 제대로 보고 싶었다", "35페이지, 내 인생을 한 권으로"],
    tagline: "10년 단위 대운까지 한 장씩, 평생 한 번 제대로 보는 사주",
    openPrice: 19900,
    listPrice: 29900,
    personCount: 1,
    sections: [
      "먼저 맞혀볼게요", "인생 총평", "타고난 기질", "숨은 재능", "재물운", "직업운", "연애·결혼운",
      "건강운", "인간관계", "대운 10년별 흐름", "올해와 내년", "인생의 전환점", "실천 조언",
    ],
    chapters: [
      { title: "먼저 맞혀볼게요", questions: ["정말 맞히는지부터 볼 수 있을까?", "내가 지나온 전환점, 나이로 짚어줄까?"] },
      { title: "인생 총평", questions: ["내 인생의 큰 그림은 어떤 모양일까?", "좋은 면과 아쉬운 면, 둘 다 말해줄까?"] },
      { title: "타고난 기질", questions: ["내 성격, 원래 이런 거였을까?", "왜 비슷한 선택을 반복해왔을까?"] },
      { title: "숨은 재능", questions: ["아직 안 쓴 카드가 있을까?", "묻힌 재능은 어디서 꺼내 쓰면 좋을까?"] },
      { title: "재물운", questions: ["돈은 언제, 어떻게 모일까?", "돈이 새기 쉬운 습관은 뭘까?"] },
      { title: "직업운", questions: ["지금 이 일, 계속해도 될까?", "힘을 쏟기 좋은 시기는 언제일까?"] },
      { title: "연애·결혼운", questions: ["인연은 어떤 시기에 올까?", "관계에서 반복되는 내 습관은?"] },
      { title: "건강운", questions: ["내 몸이 보내는 신호가 있을까?", "지치기 쉬운 시기는 언제일까?"] },
      { title: "인간관계", questions: ["왜 그 사람과는 자꾸 부딪힐까?", "힘이 되는 관계와 에너지가 새는 관계는?"] },
      { title: "대운 10년별 흐름", questions: ["몇 살부터 흐름이 바뀔까?", "언제 밀고 언제 다져야 할까?"] },
      { title: "올해와 내년", questions: ["올해는 벌릴 때일까, 다질 때일까?", "내년은 어떤 흐름 위에 있을까?"] },
      { title: "인생의 전환점", questions: ["다음 전환점은 언제쯤일까?", "무엇을 준비해두면 좋을까?"] },
      { title: "실천 조언", questions: ["그래서, 뭘 하면 될까?", "오늘부터 할 수 있는 일은?"] },
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
    heroQuestion: "나도, 올해도, 일도\n한 번에 볼 수 있을까?",
    moments: ["나를 알고, 올해를 알고, 일을 안다", "세 권이 모여 하나의 지도가 된다"],
    tagline: "나의 전체 설계도부터 올해의 타이밍까지, 한 번에 전부",
    openPrice: 17900,
    listPrice: 24900,
    personCount: 1,
    sections: ["평생사주 종합 리포트", "올해 운세 리포트", "직업·재물운 리포트"],
    chapters: [
      { title: "평생사주 종합 리포트", questions: ["나는 원래 어떤 사람일까?", "타고난 강점과 조심하면 좋은 지점은?", "듣기 좋은 말만 담지 않은 나의 사용설명서일까?"] },
      { title: "올해 운세 리포트", questions: ["올해는 어떤 흐름 위에 있을까?", "밀어붙일 시기와 숨 고를 시기는?"] },
      { title: "직업·재물운 리포트", questions: ["내 강점은 어디서 빛을 볼까?", "재물이 모이기 쉬운 흐름은 언제일까?"] },
    ],
    bundleCodes: ["lifetime", "year", "career"],
    pdfPages: 44,
    charCount: "13,000자",
  },
  lifetime: {
    code: "lifetime",
    name: "평생사주 종합 리포트",
    shortName: "평생사주",
    cardTitle: "타고난 내 팔자, 전부 펼쳐보기",
    heroQuestion: "타고난 내 팔자,\n전부 펼쳐볼까?",
    moments: ["듣기 좋은 말 대신, 나라는 사람의 설계도", "애쓰지 않아도 되는 부분이 있다는 것"],
    tagline: "타고난 기질부터 재물·직업·연애·건강까지, 나의 전체 설계도",
    openPrice: 6900,
    listPrice: 9900,
    personCount: 1,
    sections: ["인생 총평", "타고난 기질", "재물운", "직업운", "연애운", "건강운", "인생 국면별 흐름", "실천 조언"],
    chapters: [
      { title: "인생 총평", questions: ["내 인생, 한 문장으로 하면 뭘까?", "사주 전체를 관통하는 큰 그림은?"] },
      { title: "타고난 기질", questions: ["내 성격, 원래 이런 거였을까?", "애쓰지 않아도 되는 부분과 다듬을 부분은?"] },
      { title: "재물운", questions: ["돈은 언제, 어떻게 모이는 걸까?", "돈이 새기 쉬운 지점은 어디일까?"] },
      { title: "직업운", questions: ["지금 이 일, 나랑 맞는 걸까?", "내 강점이 힘을 내는 환경은?"] },
      { title: "연애운", questions: ["나는 사랑할 때 어떤 사람일까?", "관계에서 반복되기 쉬운 내 패턴은?"] },
      { title: "건강운", questions: ["어디를 먼저 챙겨야 할까?", "무리가 쌓이기 쉬운 지점은?"] },
      { title: "인생 국면별 흐름", questions: ["지금 나는 인생의 몇 페이지쯤일까?", "힘을 쓸 때와 다질 때는 언제일까?"] },
      { title: "실천 조언", questions: ["그래서, 내일부터 뭘 하면 될까?", "오늘 해볼 수 있는 행동은?"] },
    ],
    pdfPages: 16,
    charCount: "6,000자",
  },
  love: {
    code: "love",
    name: "연애·궁합 리포트",
    shortName: "궁합운세",
    cardTitle: "우리 둘, 사주로 보면 몇 점일까?",
    heroQuestion: "우리 둘,\n사주로 보면 몇 점일까?",
    moments: ["왜 끌리고, 왜 부딪히는지", "두 사주가 만나는 자리에 답이 있다"],
    tagline: "두 사람의 사주를 교차 분석한 케미 리포트",
    openPrice: 9900,
    listPrice: 12900,
    personCount: 2,
    sections: ["케미 총평", "나의 연애 스타일", "상대의 연애 스타일", "끌림 포인트", "갈등 포인트", "관계 조언"],
    chapters: [
      { title: "케미 총평", questions: ["우리 케미, 근거 있는 확신일까?", "이 관계의 전체 온도는 어느 정도일까?"] },
      { title: "나의 연애 스타일", questions: ["나는 사랑할 때 어떤 사람일까?", "내가 무심코 반복하는 패턴은?"] },
      { title: "상대의 연애 스타일", questions: ["그 사람 속마음, 짐작만 하고 있는 걸까?", "상대가 애정을 표현하고 받는 방식은?"] },
      { title: "끌림 포인트", questions: ["우리는 어디서 서로에게 끌렸을까?", "이 관계가 더 깊어지는 순간은?"] },
      { title: "갈등 포인트", questions: ["좋은데 왜 자꾸 부딪히는 걸까?", "미리 알면 피할 수 있는 지점은?"] },
      { title: "관계 조언", questions: ["그래서 우리, 어떻게 하면 좋을까?", "끌림은 살리고 갈등은 줄이려면?"] },
    ],
    pdfPages: 13,
    charCount: "3,500자",
  },
  year: {
    code: "year",
    name: "올해 운세 리포트",
    shortName: "올해운세",
    cardTitle: "2026 병오년, 나의 남은 운은?",
    heroQuestion: "2026 병오년,\n나의 남은 운은?",
    moments: ["밀어붙일 때와 멈출 때", "올해의 리듬을 미리 알고 걷는다"],
    tagline: "올해의 흐름과 월별 리듬, 지금 잡아야 할 타이밍",
    openPrice: 6900,
    listPrice: 9900,
    personCount: 1,
    sections: ["올해 총평", "커리어·재물", "관계·연애", "건강·컨디션", "월별 흐름", "올해의 전략"],
    chapters: [
      { title: "올해 총평", questions: ["올해, 나한테 어떤 해일까?", "병오년의 기운이 내 사주와 만나면?"] },
      { title: "커리어·재물", questions: ["일과 돈, 올해 승부수는 언제?", "지출과 투자에 신중해야 할 흐름은?"] },
      { title: "관계·연애", questions: ["올해 인연 운은 어떻게 흐를까?", "오해가 생기기 쉬운 시기는?"] },
      { title: "건강·컨디션", questions: ["유독 지치는 시기가 있다면?", "회복에 좋은 시기는 언제일까?"] },
      { title: "월별 흐름", questions: ["12달 중 내 기회의 달은 언제?", "조심할 달은 언제일까?"] },
      { title: "올해의 전략", questions: ["그래서 올해 뭘 하면 될까?", "밀어붙일 것과 미룰 것은?"] },
    ],
    pdfPages: 14,
    charCount: "3,000자",
  },
  career: {
    code: "career",
    name: "직업·재물운 리포트",
    shortName: "직업·재물운",
    cardTitle: "돈이 붙는 일은 따로 있다던데?",
    heroQuestion: "돈이 붙는 일은\n따로 있을까?",
    moments: ["잘하는 것과, 돈이 되는 것", "내 그릇의 크기를 알면 길이 보인다"],
    tagline: "나에게 맞는 일과 재물의 그릇, 커리어의 방향",
    openPrice: 6900,
    listPrice: 9900,
    personCount: 1,
    sections: ["총평", "강점과 재능", "맞는 일과 환경", "재물의 그릇", "올해의 커리어 흐름", "실천 조언"],
    chapters: [
      { title: "총평", questions: ["내 커리어, 한눈에 보면 어떤 그림일까?", "일과 돈의 큰 흐름은?"] },
      { title: "강점과 재능", questions: ["잘하는 건 많은데, 뭘 밀어야 할까?", "성과로 이어지는 강점은?"] },
      { title: "맞는 일과 환경", questions: ["회사가 맞을까, 내 일이 맞을까?", "어울리는 직군 세 가지는?"] },
      { title: "재물의 그릇", questions: ["나는 돈을 얼마나 담을 수 있는 사람일까?", "돈이 모이는 방식과 새는 지점은?"] },
      { title: "올해의 커리어 흐름", questions: ["지금 이직해도 괜찮은 걸까?", "힘이 실리는 시기는 언제일까?"] },
      { title: "실천 조언", questions: ["그래서, 당장 뭘 하면 될까?", "오늘부터 적용할 행동은?"] },
    ],
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
    heroQuestion: "헤어진 그 사람,\n다시 만날 수 있을까?",
    moments: ["아직 이어진 걸까, 이미 끝난 걸까", "듣고 싶은 답 대신, 두 사람의 진짜 흐름"],
    tagline: "두 사람의 사주가 말하는 재회 가능성의 구조, 그리고 타이밍",
    openPrice: 12900,
    listPrice: 16900,
    personCount: 2,
    sections: [
      "지금 두 사람의 기운", "상대의 지금 마음결", "재회 가능성의 구조",
      "다시 만난다면 달라져야 할 것", "움직인다면 언제", "마음을 위한 조언",
    ],
    chapters: [
      { title: "지금 두 사람의 기운", questions: ["우리는 정말 끝난 걸까?", "아직 이어진 흐름일까, 정리된 흐름일까?"] },
      { title: "상대의 지금 마음결", questions: ["그 사람도 나를 생각할까?", "마음이 열리기 쉬운 상태일까?"] },
      { title: "재회 가능성의 구조", questions: ["다시 이어질 수 있을까?", "다시 만나기 쉬운 조건과 어려운 조건은?"] },
      { title: "다시 만난다면 달라져야 할 것", questions: ["또 같은 이유로 헤어지면 어쩌지?", "다른 시작이 되려면 무엇이 달라져야 할까?"] },
      { title: "움직인다면 언제", questions: ["연락해도 되는 때가 있을까?", "서두르면 어긋나기 쉬운 시기는?"] },
      { title: "마음을 위한 조언", questions: ["재회만이 답은 아닐지도?", "기다리는 동안 나를 돌보려면?"] },
    ],
    pdfPages: 13,
    charCount: "3,500자",
  },
  marriage: {
    code: "marriage",
    name: "결혼운세 리포트",
    shortName: "결혼운세",
    cardTitle: "나는 언제, 어떤 사람과 결혼할까?",
    heroQuestion: "언제, 어떤 사람과\n결혼하게 될까?",
    moments: ["내 인생에 한 번뿐일 그 약속", "누구와, 언제쯤일지 흐름으로 읽는다"],
    tagline: "배우자의 결과 결혼운이 짙어지는 시기를 나이로 짚어주는 리포트",
    openPrice: 12900,
    listPrice: 16900,
    personCount: 1,
    sections: [
      "결혼운 총평", "만나게 될 배우자의 결", "결혼운이 짙어지는 시기",
      "결혼 전 의식할 나의 패턴", "올해의 인연운", "실천 조언",
    ],
    chapters: [
      { title: "결혼운 총평", questions: ["내 결혼운, 좋은 편일까?", "사주에 담긴 결혼의 큰 흐름은?"] },
      { title: "만나게 될 배우자의 결", questions: ["어떤 사람을 만나게 될까?", "나와 잘 맞는 기질은?"] },
      { title: "결혼운이 짙어지는 시기", questions: ["몇 살 무렵이 내 시기일까?", "준비하기 좋은 흐름은 언제일까?"] },
      { title: "결혼 전 의식할 나의 패턴", questions: ["왜 늘 비슷한 지점에서 흔들릴까?", "관계에서 반복되는 내 습관은?"] },
      { title: "올해의 인연운", questions: ["올해, 만남의 기회가 있을까?", "움직일 때일까, 다져둘 때일까?"] },
      { title: "실천 조언", questions: ["그래서, 지금 뭘 하면 될까?", "오늘부터 해볼 준비는?"] },
    ],
    pdfPages: 13,
    charCount: "3,500자",
  },
  dohwa: {
    code: "dohwa",
    name: "도화살 리포트",
    shortName: "도화살",
    cardTitle: "내 사주에 도화살, 정말 있을까?",
    heroQuestion: "내 사주에 도화살,\n정말 있을까?",
    moments: ["있다면 어떻게 쓸까, 없다면 나의 매력은", "만세력이 판정하고, 돌려 말하지 않는다"],
    tagline: "만세력이 판정한 나의 도화살 — 있으면 쓰는 법, 없으면 나만의 매력 구조",
    openPrice: 9900,
    listPrice: 12900,
    personCount: 1,
    sections: [
      "판정 결과", "나의 매력 구조", "매력이 빛나는 순간과 그늘",
      "연애에서의 도화", "올해의 이성운", "실천 조언",
    ],
    chapters: [
      { title: "판정 결과", questions: ["그래서, 나 도화살 있는 거예요?", "없으면 없다고 말해줄까?"] },
      { title: "나의 매력 구조", questions: ["내 매력은 어디서 나오는 걸까?", "나만의 끌림 포인트는?"] },
      { title: "매력이 빛나는 순간과 그늘", questions: ["왜 어떤 날은 통하고 어떤 날은 어색할까?", "오해로 이어지기 쉬운 순간은?"] },
      { title: "연애에서의 도화", questions: ["연애할 때 나는 어떤 사람일까?", "관계가 깊어질 때 나오는 패턴은?"] },
      { title: "올해의 이성운", questions: ["올해, 만남의 흐름은 어떨까?", "인연이 이어지기 쉬운 시기는?"] },
      { title: "실천 조언", questions: ["그래서 뭘 하면 되는 걸까?", "오늘부터 해볼 수 있는 행동은?"] },
    ],
    pdfPages: 13,
    charCount: "3,000자",
  },
  crush: {
    code: "crush",
    name: "짝사랑·썸 리포트",
    shortName: "속마음운세",
    cardTitle: "그 사람도 나를 생각하고 있을까?",
    heroQuestion: "그 사람도\n나를 생각하고 있을까?",
    moments: ["혼자 짐작하다 지친 밤", "두 사람의 온도를 담담하게 재본다"],
    tagline: "두 사람의 기운 교차로 읽는 지금의 온도, 다가가는 타이밍",
    openPrice: 9900,
    listPrice: 12900,
    personCount: 2,
    sections: [
      "지금 두 사람의 온도", "상대가 나를 보는 결", "끌림의 구조",
      "머뭇거리게 만드는 것", "다가간다면 어떻게, 언제", "마음을 위한 조언",
    ],
    chapters: [
      { title: "지금 두 사람의 온도", questions: ["우리, 썸이 맞긴 한 걸까?", "혼자만의 착각일까, 오가는 기류일까?"] },
      { title: "상대가 나를 보는 결", questions: ["그 사람 눈에 나는 어떤 사람일까?", "나라는 사람이 그에게 닿는 결은?"] },
      { title: "끌림의 구조", questions: ["내가 왜 이 사람에게 끌렸을까?", "이 마음은 어디서 시작됐을까?"] },
      { title: "머뭇거리게 만드는 것", questions: ["왜 자꾸 말이 목 끝에서 멈출까?", "망설임에도 이유가 있을까?"] },
      { title: "다가간다면 어떻게, 언제", questions: ["고백, 지금 해도 괜찮은 타이밍일까?", "어울리는 다가감의 방식은?"] },
      { title: "마음을 위한 조언", questions: ["이 마음, 계속 가도 되는 걸까?", "접는 것도 괜찮은 선택일까?"] },
    ],
    pdfPages: 13,
    charCount: "3,000자",
  },
};

export function getProduct(code: string): Product | null {
  return (PRODUCTS as Record<string, Product>)[code] ?? null;
}

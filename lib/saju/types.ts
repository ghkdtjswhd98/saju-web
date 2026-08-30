// 사주 계산 결과 타입 — saju-mvp/index.html SECTION 7 계산 구조와 동일

export type Element = "목" | "화" | "토" | "금" | "수";
export type YinYang = "양" | "음";

export interface Pillar {
  hangul: string; // 예: "갑자"
  hanja: string;  // 예: "甲子"
  stem: string;   // 천간 1글자
  branch: string; // 지지 1글자
}

export interface Pillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null; // 시간 모름이면 null
}

export interface DayMaster {
  char: string;
  element: Element;
  yinyang: "陽" | "陰";
}

export interface ElementDist {
  name: Element;
  count: number; // 지장간 가중치 반영 소수점
}

export interface SipsinEntry {
  position: string; // 년간/년지/월간/월지/일지/시간/시지
  char: string;
  label: string;    // 비견/겁재/식신/...
}

export type SipsinWeights = Record<
  "비견" | "겁재" | "식신" | "상관" | "편재" | "정재" | "편관" | "정관" | "편인" | "정인",
  number
>;

export type RatingKey = "매력도" | "재물운" | "돌파력" | "낭만력" | "마이웨이";

export interface Ratings {
  stars: Record<RatingKey, string>;   // "⭐⭐⭐☆☆" (프롬프트 호환)
  starsNum: Record<RatingKey, number>; // 1~5 (UI 렌더용)
  raw: Record<RatingKey, number>;
  weights: SipsinWeights;
}

export interface ExpertPillarRow {
  pos: "hour" | "day" | "month" | "year";
  hangul: string;
  hanja: string;
  stem: string;
  branch: string;
  stemSipsin: string;
  branchSipsin: string;
  jijanggan: string;
  unseong: string;
  naeum: string;
  sinsal12: string;
}

export interface JijiRelations {
  충: string[];
  합: string[];
  반합: string[];
  삼합: string[];
  형: string[];
}

export interface ExpertExtra {
  공망: string[];
  형충합: JijiRelations;
  월령: string;
  천을위치: string[];
}

export interface SajuInput {
  year: number;
  month: number;
  day: number;
  hourValue: string; // "unknown" 또는 "0"|"2"|...|"22" (지지시 시작 시각)
  isLunar: boolean;
  isLeap: boolean;
}

// 대운 — 10년 단위 인생 국면 시간표 (성별이 있어야 계산 가능)
export interface DaewoonPillar {
  startAge: number; // 한국식 나이 근사 (대운수 기준)
  endAge: number;
  hangul: string; // 예: "기묘"
  hanja: string; // 예: "己卯"
}

export interface Daewoon {
  direction: "순행" | "역행";
  startAge: number; // 첫 대운 시작 나이 (대운수)
  pillars: DaewoonPillar[]; // 8개 (80년치)
}

export interface SajuResult {
  pillars: Pillars;
  dayMaster: DayMaster;
  elementDist: ElementDist[];
  sipsin: SipsinEntry[];
  sipsinWeights: SipsinWeights;
  sinsal: string[];
  ratings: Ratings;
  hasHour: boolean;
  currentYear: number;
  currentYearPillar: { hangul: string; hanja: string };
  expert: ExpertPillarRow[];
  expertExtra: ExpertExtra;
  daewoon?: Daewoon; // 성별이 주어진 경우에만
  /** 절입일 출생 정보 — adjusted면 월주(±연주)를 시각 기준으로 보정했음 (lib/saju/jeolip.ts) */
  jeolip?: import("./jeolip").JeolipInfo;
}

// 상황 정보 선택지 — 입력 폼 칩과 검증 화이트리스트의 단일 진실.
// 순서는 실측 수요 순(포스텔러 조회수·커뮤니티 질문 빈도)이라 폼 노출 순서로도 그대로 쓴다.
export const LOVE_STATUS = ["솔로", "연애중", "기혼"] as const;
export const LOVE_DURATION = ["1년 미만", "1~3년", "3~5년", "5년 이상"] as const;
export const JOB_STATUS = [
  "학생", "직장인", "사업·자영업", "프리랜서", "구직·이직 준비중", "쉬는 중",
] as const;
export const CONCERN_TOPIC = [
  "연애·결혼", "직업·이직", "돈·재물", "인간관계", "건강", "학업·시험",
] as const;

export interface PersonInput extends SajuInput {
  name: string;
  gender: "남" | "여";
  // ── 이하 전부 선택 — 없어도 리포트는 만들어진다 (기존 데이터 하위 호환) ──
  /** 연애 상태. 연애·결혼 섹션을 상황에 맞게 쓰는 근거 */
  loveStatus?: (typeof LOVE_STATUS)[number];
  /** 연애/솔로 기간 */
  loveDuration?: (typeof LOVE_DURATION)[number];
  /** 직업 상황. 직업운을 뜬구름 잡지 않게 하는 근거 */
  jobStatus?: (typeof JOB_STATUS)[number];
  /** 지금 가장 궁금한 주제 */
  concernTopic?: (typeof CONCERN_TOPIC)[number];
  /** 자유 서술 고민 (200자). 위기 키워드 검출 시 프롬프트에 넣지 않는다 */
  concern?: string;
}

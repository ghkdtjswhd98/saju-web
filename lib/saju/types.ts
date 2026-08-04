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
}

export interface PersonInput extends SajuInput {
  name: string;
  gender: "남" | "여";
}

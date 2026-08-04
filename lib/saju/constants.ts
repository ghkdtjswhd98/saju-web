// 명리학 상수 테이블 — saju-mvp/index.html SECTION 5 그대로 이식 (고정값)
import type { Element, YinYang } from "./types";

export const STEM_ELEMENT: Record<string, Element> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토",
  기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};
export const BRANCH_ELEMENT: Record<string, Element> = {
  자: "수", 축: "토", 인: "목", 묘: "목", 진: "토", 사: "화",
  오: "화", 미: "토", 신: "금", 유: "금", 술: "토", 해: "수",
};
export const STEM_YINYANG: Record<string, YinYang> = {
  갑: "양", 을: "음", 병: "양", 정: "음", 무: "양",
  기: "음", 경: "양", 신: "음", 임: "양", 계: "음",
};
export const BRANCH_YINYANG: Record<string, YinYang> = {
  자: "양", 축: "음", 인: "양", 묘: "음", 진: "양", 사: "음",
  오: "양", 미: "음", 신: "양", 유: "음", 술: "양", 해: "음",
};
export const SHENG: Record<Element, Element> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
export const KE: Record<Element, Element> = { 목: "토", 토: "수", 수: "화", 화: "금", 금: "목" };

export const HOUR_BRANCH_LABEL: Record<string, string> = {
  "0": "자시", "2": "축시", "4": "인시", "6": "묘시", "8": "진시", "10": "사시",
  "12": "오시", "14": "미시", "16": "신시", "18": "유시", "20": "술시", "22": "해시",
};

export const HOUR_OPTIONS: { value: string; label: string }[] = [
  { value: "unknown", label: "모름" },
  { value: "0", label: "자시 (23:30~01:30)" },
  { value: "2", label: "축시 (01:30~03:30)" },
  { value: "4", label: "인시 (03:30~05:30)" },
  { value: "6", label: "묘시 (05:30~07:30)" },
  { value: "8", label: "진시 (07:30~09:30)" },
  { value: "10", label: "사시 (09:30~11:30)" },
  { value: "12", label: "오시 (11:30~13:30)" },
  { value: "14", label: "미시 (13:30~15:30)" },
  { value: "16", label: "신시 (15:30~17:30)" },
  { value: "18", label: "유시 (17:30~19:30)" },
  { value: "20", label: "술시 (19:30~21:30)" },
  { value: "22", label: "해시 (21:30~23:30)" },
];

// 지장간 (본기 1.0, 중기 0.3, 여기 0.2) — 오행 분포 가중치 계산용
export const BRANCH_HIDDEN_STEMS: Record<string, { stem: string; weight: number }[]> = {
  자: [{ stem: "계", weight: 1.0 }, { stem: "임", weight: 0.2 }],
  축: [{ stem: "기", weight: 1.0 }, { stem: "계", weight: 0.3 }, { stem: "신", weight: 0.2 }],
  인: [{ stem: "갑", weight: 1.0 }, { stem: "병", weight: 0.3 }, { stem: "무", weight: 0.2 }],
  묘: [{ stem: "을", weight: 1.0 }, { stem: "갑", weight: 0.2 }],
  진: [{ stem: "무", weight: 1.0 }, { stem: "을", weight: 0.3 }, { stem: "계", weight: 0.2 }],
  사: [{ stem: "병", weight: 1.0 }, { stem: "경", weight: 0.3 }, { stem: "무", weight: 0.2 }],
  오: [{ stem: "정", weight: 1.0 }, { stem: "기", weight: 0.3 }, { stem: "병", weight: 0.2 }],
  미: [{ stem: "기", weight: 1.0 }, { stem: "정", weight: 0.3 }, { stem: "을", weight: 0.2 }],
  신: [{ stem: "경", weight: 1.0 }, { stem: "임", weight: 0.3 }, { stem: "무", weight: 0.2 }],
  유: [{ stem: "신", weight: 1.0 }, { stem: "경", weight: 0.2 }],
  술: [{ stem: "무", weight: 1.0 }, { stem: "신", weight: 0.3 }, { stem: "정", weight: 0.2 }],
  해: [{ stem: "임", weight: 1.0 }, { stem: "갑", weight: 0.3 }],
};

// 신살 판정 테이블 (대표 6종)
export const CHEONEUL_MAP: Record<string, string[]> = {
  갑: ["축", "미"], 무: ["축", "미"], 경: ["축", "미"],
  을: ["자", "신"], 기: ["자", "신"],
  병: ["해", "유"], 정: ["해", "유"],
  신: ["오", "인"],
  임: ["사", "묘"], 계: ["사", "묘"],
};
export const DOHWA_MAP: Record<string, string> = {
  신: "유", 자: "유", 진: "유",
  인: "묘", 오: "묘", 술: "묘",
  사: "오", 유: "오", 축: "오",
  해: "자", 묘: "자", 미: "자",
};
export const YEOKMA_MAP: Record<string, string> = {
  신: "인", 자: "인", 진: "인",
  인: "신", 오: "신", 술: "신",
  사: "해", 유: "해", 축: "해",
  해: "사", 묘: "사", 미: "사",
};
export const HWAGAE_MAP: Record<string, string> = {
  신: "진", 자: "진", 진: "진",
  인: "술", 오: "술", 술: "술",
  사: "축", 유: "축", 축: "축",
  해: "미", 묘: "미", 미: "미",
};
export const MUNCHANG_MAP: Record<string, string> = {
  갑: "사", 을: "오", 병: "신", 정: "유", 무: "신",
  기: "유", 경: "해", 신: "자", 임: "인", 계: "묘",
};
export const YANGIN_MAP: Record<string, string> = {
  갑: "묘", 병: "오", 무: "오", 경: "유", 임: "자",
};

// ── 전문 데이터용 매핑 테이블 ────────────────────────────────

export const STEMS_ORDER = "갑을병정무기경신임계";
export const BRANCHES_ORDER = "자축인묘진사오미신유술해";
export const STEM_HANJA: Record<string, string> = {
  갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊", 기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸",
};
export const BRANCH_HANJA: Record<string, string> = {
  자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳",
  오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥",
};
export const BRANCH_INDEX: Record<string, number> = {
  자: 0, 축: 1, 인: 2, 묘: 3, 진: 4, 사: 5, 오: 6, 미: 7, 신: 8, 유: 9, 술: 10, 해: 11,
};

// 12운성 (일간 양간 순행, 음간 역행 / 시작점 = 장생지)
export const TWELVE_STAGES = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"];
export const STAGE_START: Record<string, number> = {
  갑: 11, 을: 6, 병: 2, 정: 9, 무: 2, 기: 9, 경: 5, 신: 0, 임: 8, 계: 3,
};

// 납음오행 (60갑자)
export const NAEUM: Record<string, string> = {
  갑자: "해중금", 을축: "해중금", 병인: "노중화", 정묘: "노중화", 무진: "대림목",
  기사: "대림목", 경오: "노방토", 신미: "노방토", 임신: "검봉금", 계유: "검봉금",
  갑술: "산두화", 을해: "산두화", 병자: "간하수", 정축: "간하수", 무인: "성두토",
  기묘: "성두토", 경진: "백랍금", 신사: "백랍금", 임오: "양류목", 계미: "양류목",
  갑신: "천중수", 을유: "천중수", 병술: "옥상토", 정해: "옥상토", 무자: "벽력화",
  기축: "벽력화", 경인: "송백목", 신묘: "송백목", 임진: "장류수", 계사: "장류수",
  갑오: "사중금", 을미: "사중금", 병신: "산하화", 정유: "산하화", 무술: "평지목",
  기해: "평지목", 경자: "벽상토", 신축: "벽상토", 임인: "금박금", 계묘: "금박금",
  갑진: "복등화", 을사: "복등화", 병오: "천하수", 정미: "천하수", 무신: "대역토",
  기유: "대역토", 경술: "차천금", 신해: "차천금", 임자: "상자목", 계축: "상자목",
  갑인: "대계수", 을묘: "대계수", 병진: "사중토", 정사: "사중토", 무오: "천상화",
  기미: "천상화", 경신: "석류목", 신유: "석류목", 임술: "대해수", 계해: "대해수",
};

// 12신살 (삼합국 기준)
export const TRIPLE_GROUP: Record<string, string> = {
  신: "신자진", 자: "신자진", 진: "신자진",
  인: "인오술", 오: "인오술", 술: "인오술",
  사: "사유축", 유: "사유축", 축: "사유축",
  해: "해묘미", 묘: "해묘미", 미: "해묘미",
};
export const SINSAL12_TABLE: Record<string, Record<string, string>> = {
  신자진: { 사: "겁살", 오: "재살", 미: "천살", 신: "지살", 유: "년살", 술: "월살",
           해: "망신", 자: "장성", 축: "반안", 인: "역마", 묘: "육해", 진: "화개" },
  인오술: { 해: "겁살", 자: "재살", 축: "천살", 인: "지살", 묘: "년살", 진: "월살",
           사: "망신", 오: "장성", 미: "반안", 신: "역마", 유: "육해", 술: "화개" },
  사유축: { 인: "겁살", 묘: "재살", 진: "천살", 사: "지살", 오: "년살", 미: "월살",
           신: "망신", 유: "장성", 술: "반안", 해: "역마", 자: "육해", 축: "화개" },
  해묘미: { 신: "겁살", 유: "재살", 술: "천살", 해: "지살", 자: "년살", 축: "월살",
           인: "망신", 묘: "장성", 진: "반안", 사: "역마", 오: "육해", 미: "화개" },
};

// 공망 (일주 60갑자가 속한 순(旬)에 따라 빠진 2개 지지)
export const SOON_GONGMANG: { startStem: string; startBranch: string; gap: string[] }[] = [
  { startStem: "갑", startBranch: "자", gap: ["술", "해"] },
  { startStem: "갑", startBranch: "술", gap: ["신", "유"] },
  { startStem: "갑", startBranch: "신", gap: ["오", "미"] },
  { startStem: "갑", startBranch: "오", gap: ["진", "사"] },
  { startStem: "갑", startBranch: "진", gap: ["인", "묘"] },
  { startStem: "갑", startBranch: "인", gap: ["자", "축"] },
];

// 지지 형충합
export const JIJI_CHUNG = [["자", "오"], ["축", "미"], ["인", "신"], ["묘", "유"], ["진", "술"], ["사", "해"]];
export const JIJI_HAP = [["자", "축"], ["인", "해"], ["묘", "술"], ["진", "유"], ["사", "신"], ["오", "미"]];
export const JIJI_SAMHAP: { trio: string[]; element: Element }[] = [
  { trio: ["신", "자", "진"], element: "수" },
  { trio: ["인", "오", "술"], element: "화" },
  { trio: ["사", "유", "축"], element: "금" },
  { trio: ["해", "묘", "미"], element: "목" },
];
export const JIJI_BANHAP = [
  ["신", "자"], ["자", "진"], ["신", "진"],
  ["인", "오"], ["오", "술"], ["인", "술"],
  ["사", "유"], ["유", "축"], ["사", "축"],
  ["해", "묘"], ["묘", "미"], ["해", "미"],
];
export const JIJI_HYUNG_THREE = [["인", "사", "신"], ["축", "술", "미"]];
export const JIJI_HYUNG_TWO = [["자", "묘"]];
export const JIJI_SELF_HYUNG = ["진", "오", "유", "해"];

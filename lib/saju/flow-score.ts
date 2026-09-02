// 월별 흐름 지수 — 월건 지지와 내 사주 지지 사이의 합·충·형 밀도를 점수화한 결정론 값.
//
// 경쟁사 벤치마킹(2026-09-02, docs/benchmark-wealth-pdf.md)에서 "월별 0~100점 차트"가
// 최고의 페이지였지만 그쪽 숫자는 근거 불명이었다. 우리는 같은 그림을 실제 계산으로 만든다:
// 같은 생년월일시 + 같은 해 → 언제나 같은 곡선. 마케팅 수치가 아니라 관계 밀도의 시각화다.
import { detectJijiRelations, getMonthlyPillars } from "./compute";
import type { SajuResult } from "./types";

export interface MonthFlow {
  month: number; // 1~12
  score: number; // 10~95
  band: "up" | "mid" | "watch"; // 상승 / 중립 / 주의
}

function personBranches(saju: SajuResult): string[] {
  const arr = [saju.pillars.year.branch, saju.pillars.month.branch, saju.pillars.day.branch];
  if (saju.pillars.hour) arr.push(saju.pillars.hour.branch);
  return arr;
}

/** 개인 지지 4개와 월건 지지 1개의 교차 관계만 점수화 (자기 내부 관계는 제외) */
export function scoreMonthBranch(own: string[], monthBranch: string): number {
  const withMonth = detectJijiRelations([...own, monthBranch]);
  const ownOnly = detectJijiRelations(own);
  const diff = (kind: keyof typeof withMonth) =>
    withMonth[kind].length - ownOnly[kind].length;

  let score = 50;
  score += diff("합") * 12; // 육합 — 끌어주는 기운
  score += diff("삼합") * 10;
  score += diff("반합") * 8;
  score -= diff("충") * 14; // 부딪히는 기운
  score -= diff("형") * 8;
  return Math.max(10, Math.min(95, score));
}

export function bandOf(score: number): MonthFlow["band"] {
  return score >= 60 ? "up" : score >= 40 ? "mid" : "watch";
}

/** 해당 연도 12개월의 흐름 지수 (월건은 만세력 엔진에서) */
export function yearlyFlow(saju: SajuResult, year: number): MonthFlow[] {
  const own = personBranches(saju);
  return getMonthlyPillars(year).map((m) => {
    // 월건 한글 2글자 중 두 번째가 지지
    const branch = m.hangul.charAt(1);
    const score = scoreMonthBranch(own, branch);
    return { month: m.month, score, band: bandOf(score) };
  });
}

// 궁합 케미 점수 — 결정론적 계산 (재미용 지표, 공유 트리거)
// 두 사주의 교차 지지 관계(합·충·형)와 오행 보완도로 산출한다.
import { JIJI_BANHAP, JIJI_CHUNG, JIJI_HAP, JIJI_HYUNG_TWO } from "./constants";
import type { SajuResult } from "./types";

function branchesOf(r: SajuResult): string[] {
  const arr = [r.pillars.year.branch, r.pillars.month.branch, r.pillars.day.branch];
  if (r.pillars.hour) arr.push(r.pillars.hour.branch);
  return arr;
}

function isPairIn(list: string[][], x: string, y: string): boolean {
  return list.some(([a, b]) => (a === x && b === y) || (a === y && b === x));
}

export interface Chemistry {
  score: number; // 58~96
  crossHap: number;   // 교차 육합+반합 수
  crossChung: number; // 교차 충 수
  complement: number; // 오행 보완 축 수
}

export function computeChemistry(a: SajuResult, b: SajuResult): Chemistry {
  const brA = branchesOf(a);
  const brB = branchesOf(b);

  let hap = 0;
  let banhap = 0;
  let chung = 0;
  let hyung = 0;
  // A의 지지 × B의 지지 교차 쌍만 평가 (각자 내부 관계는 제외)
  for (const x of brA) {
    for (const y of brB) {
      if (isPairIn(JIJI_HAP, x, y)) hap++;
      if (isPairIn(JIJI_BANHAP, x, y)) banhap++;
      if (isPairIn(JIJI_CHUNG, x, y)) chung++;
      if (isPairIn(JIJI_HYUNG_TWO, x, y)) hyung++;
    }
  }

  // 오행 보완: 한쪽이 강하고(≥2.5) 다른 쪽이 부족한(≤0.8) 오행 축의 수
  let complement = 0;
  for (let i = 0; i < 5; i++) {
    const ca = a.elementDist[i].count;
    const cb = b.elementDist[i].count;
    if ((ca >= 2.5 && cb <= 0.8) || (cb >= 2.5 && ca <= 0.8)) complement++;
  }

  const raw = 62 + hap * 8 + banhap * 4 + complement * 4 - chung * 6 - hyung * 4;
  const score = Math.max(58, Math.min(96, raw));

  return { score, crossHap: hap + banhap, crossChung: chung, complement };
}

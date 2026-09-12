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

/** 케미 계산에 필요한 최소 파생값 — 케미 초대 링크는 생년월일 대신 이것만 저장한다(개인정보 원칙) */
export interface ChemiSubset {
  branches: string[]; // 년·월·일(·시) 지지 3~4글자
  elements: number[]; // 목·화·토·금·수 순 오행 분포(지장간 가중 소수)
}

export function toChemiSubset(r: SajuResult): ChemiSubset {
  return { branches: branchesOf(r), elements: r.elementDist.map((e) => e.count) };
}

// 지지·오행 분포만으로 계산 — SajuResult 전체가 없어도(저장된 서브셋) 같은 점수가 나온다
export function computeChemistryFromSubsets(a: ChemiSubset, b: ChemiSubset): Chemistry {
  let hap = 0;
  let banhap = 0;
  let chung = 0;
  let hyung = 0;
  // A의 지지 × B의 지지 교차 쌍만 평가 (각자 내부 관계는 제외)
  for (const x of a.branches) {
    for (const y of b.branches) {
      if (isPairIn(JIJI_HAP, x, y)) hap++;
      if (isPairIn(JIJI_BANHAP, x, y)) banhap++;
      if (isPairIn(JIJI_CHUNG, x, y)) chung++;
      if (isPairIn(JIJI_HYUNG_TWO, x, y)) hyung++;
    }
  }

  // 오행 보완: 한쪽이 강하고(≥2.5) 다른 쪽이 부족한(≤0.8) 오행 축의 수
  let complement = 0;
  for (let i = 0; i < 5; i++) {
    const ca = a.elements[i] ?? 0;
    const cb = b.elements[i] ?? 0;
    if ((ca >= 2.5 && cb <= 0.8) || (cb >= 2.5 && ca <= 0.8)) complement++;
  }

  const raw = 62 + hap * 8 + banhap * 4 + complement * 4 - chung * 6 - hyung * 4;
  const score = Math.max(58, Math.min(96, raw));

  return { score, crossHap: hap + banhap, crossChung: chung, complement };
}

export function computeChemistry(a: SajuResult, b: SajuResult): Chemistry {
  return computeChemistryFromSubsets(toChemiSubset(a), toChemiSubset(b));
}

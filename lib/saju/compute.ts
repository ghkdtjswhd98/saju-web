// 결정론적 사주 계산 엔진 — saju-mvp/index.html SECTION 7 이식
// 환각 방지 원칙: 팔자/오행/십신/신살/별점은 전부 여기서 계산하고 Claude는 해석만 담당한다.
import { calculateSaju, lunarToSolar } from "@fullstackfamily/manseryeok";
import {
  STEM_ELEMENT, BRANCH_ELEMENT, STEM_YINYANG, BRANCH_YINYANG, SHENG, KE,
  BRANCH_HIDDEN_STEMS, CHEONEUL_MAP, DOHWA_MAP, YEOKMA_MAP, HWAGAE_MAP,
  MUNCHANG_MAP, YANGIN_MAP, STEMS_ORDER, BRANCHES_ORDER, BRANCH_INDEX,
  TWELVE_STAGES, STAGE_START, NAEUM, TRIPLE_GROUP, SINSAL12_TABLE,
  SOON_GONGMANG, JIJI_CHUNG, JIJI_HAP, JIJI_SAMHAP, JIJI_BANHAP,
  JIJI_HYUNG_THREE, JIJI_HYUNG_TWO, JIJI_SELF_HYUNG,
} from "./constants";
import type {
  ElementDist, ExpertPillarRow, JijiRelations, Pillars, Ratings, RatingKey,
  SajuInput, SajuResult, SipsinEntry, SipsinWeights,
} from "./types";

export function deriveSipsin(dayStem: string, targetChar: string, isStem: boolean): string {
  const E0 = STEM_ELEMENT[dayStem];
  const Y0 = STEM_YINYANG[dayStem];
  const E = isStem ? STEM_ELEMENT[targetChar] : BRANCH_ELEMENT[targetChar];
  const Y = isStem ? STEM_YINYANG[targetChar] : BRANCH_YINYANG[targetChar];
  const same = Y0 === Y;

  if (E === E0) return same ? "비견" : "겁재";
  if (SHENG[E0] === E) return same ? "식신" : "상관";
  if (KE[E0] === E) return same ? "편재" : "정재";
  if (KE[E] === E0) return same ? "편관" : "정관";
  if (SHENG[E] === E0) return same ? "편인" : "정인";
  return "?";
}

// 오행 분포 (지장간 가중치 반영 — 소수점)
export function computeOhaengDistribution(stems: string[], branches: string[]): ElementDist[] {
  const dist: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const s of stems) {
    const el = STEM_ELEMENT[s];
    if (el) dist[el] += 1.0;
  }
  for (const b of branches) {
    const hidden = BRANCH_HIDDEN_STEMS[b] || [];
    for (const h of hidden) {
      const el = STEM_ELEMENT[h.stem];
      if (el) dist[el] += h.weight;
    }
  }
  return (["목", "화", "토", "금", "수"] as const).map((name) => ({
    name,
    count: Math.round(dist[name] * 10) / 10,
  }));
}

// 별점 변환: 0.0~0.5→1점 / ~1.5→2점 / ~2.5→3점 / ~3.5→4점 / 3.5+→5점
function ratingToStarNum(value: number): number {
  let n = 1;
  if (value >= 0.5) n = 2;
  if (value >= 1.5) n = 3;
  if (value >= 2.5) n = 4;
  if (value >= 3.5) n = 5;
  return n;
}

export function computeSipsinWeights(pillars: Pillars, hasHour: boolean, dayStem: string): SipsinWeights {
  const w: SipsinWeights = {
    비견: 0, 겁재: 0, 식신: 0, 상관: 0, 편재: 0,
    정재: 0, 편관: 0, 정관: 0, 편인: 0, 정인: 0,
  };
  const stems = [pillars.year.stem, pillars.month.stem];
  if (hasHour && pillars.hour) stems.push(pillars.hour.stem);
  for (const s of stems) {
    const label = deriveSipsin(dayStem, s, true) as keyof SipsinWeights;
    if (w[label] !== undefined) w[label] += 1.0;
  }
  const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch];
  if (hasHour && pillars.hour) branches.push(pillars.hour.branch);
  for (const b of branches) {
    const hidden = BRANCH_HIDDEN_STEMS[b] || [];
    for (const h of hidden) {
      const label = deriveSipsin(dayStem, h.stem, true) as keyof SipsinWeights;
      if (w[label] !== undefined) w[label] += h.weight;
    }
  }
  return w;
}

export function computeRatings(w: SipsinWeights, sinsal: string[]): Ratings {
  const yangin = sinsal.includes("양인살") ? 1.5 : 0;
  const raw: Record<RatingKey, number> = {
    매력도: w.식신 * 0.6 + w.상관 * 0.4,
    재물운: w.정재 * 0.5 + w.편재 * 0.5,
    돌파력: w.편관 * 0.6 + w.상관 * 0.2 + yangin * 0.2,
    낭만력: w.정관 * 0.4 + w.정인 * 0.3 + w.식신 * 0.3,
    마이웨이: w.비견 * 0.5 + w.겁재 * 0.3 + w.상관 * 0.2,
  };
  const stars = {} as Record<RatingKey, string>;
  const starsNum = {} as Record<RatingKey, number>;
  for (const [k, v] of Object.entries(raw) as [RatingKey, number][]) {
    const n = ratingToStarNum(v);
    starsNum[k] = n;
    stars[k] = "⭐".repeat(n) + "☆".repeat(5 - n);
  }
  return { stars, starsNum, raw, weights: w };
}

// 60갑자 인덱스 (갑자=0, 계해=59)
function ganjiIndex(stem: string, branch: string): number {
  const sIdx = STEMS_ORDER.indexOf(stem);
  const bIdx = BRANCHES_ORDER.indexOf(branch);
  if (sIdx < 0 || bIdx < 0) return -1;
  for (let i = 0; i < 60; i++) {
    if (i % 10 === sIdx && i % 12 === bIdx) return i;
  }
  return -1;
}

// 12운성: 일간 기준 각 지지의 운성 단계
export function get12Unseong(dayStem: string, targetBranch: string): string {
  const start = STAGE_START[dayStem];
  const target = BRANCH_INDEX[targetBranch];
  if (start === undefined || target === undefined) return "";
  const yang = STEM_YINYANG[dayStem] === "양";
  const offset = yang ? (target - start + 12) % 12 : (start - target + 12) % 12;
  return TWELVE_STAGES[offset];
}

export function getNaeum(stem: string, branch: string): string {
  return NAEUM[stem + branch] || "";
}

export function get12Sinsal(refBranch: string, targetBranch: string): string | null {
  const group = TRIPLE_GROUP[refBranch];
  if (!group) return null;
  return SINSAL12_TABLE[group][targetBranch] || null;
}

export function getGongmang(dayStem: string, dayBranch: string): string[] {
  const idx = ganjiIndex(dayStem, dayBranch);
  if (idx < 0) return [];
  return SOON_GONGMANG[Math.floor(idx / 10)].gap;
}

// 형충합 검사 (삼합·반합·자형 포함)
export function detectJijiRelations(branches: string[]): JijiRelations {
  const set = new Set(branches);
  const found: JijiRelations = { 충: [], 합: [], 반합: [], 삼합: [], 형: [] };

  for (const [a, b] of JIJI_CHUNG) if (set.has(a) && set.has(b)) found.충.push(`${a}${b}충`);
  for (const [a, b] of JIJI_HAP) if (set.has(a) && set.has(b)) found.합.push(`${a}${b}합`);

  const samhapBranches = new Set<string>();
  for (const { trio, element } of JIJI_SAMHAP) {
    if (trio.every((x) => set.has(x))) {
      found.삼합.push(`${trio.join("")}삼합(${element})`);
      trio.forEach((x) => samhapBranches.add(x));
    }
  }
  for (const [a, b] of JIJI_BANHAP) {
    if (set.has(a) && set.has(b) && !(samhapBranches.has(a) && samhapBranches.has(b))) {
      found.반합.push(`${a}${b}반합`);
    }
  }
  for (const trio of JIJI_HYUNG_THREE) {
    const c = trio.filter((x) => set.has(x));
    if (c.length === 3) found.형.push(`${c.join("")}삼형`);
    else if (c.length === 2) found.형.push(`${c.join("")}형`);
  }
  for (const [a, b] of JIJI_HYUNG_TWO) if (set.has(a) && set.has(b)) found.형.push(`${a}${b}형`);
  for (const x of JIJI_SELF_HYUNG) {
    const cnt = branches.filter((b) => b === x).length;
    if (cnt >= 2) found.형.push(`${x}${x}자형`);
  }
  return found;
}

export function getJijangganStr(branch: string): string {
  const hidden = BRANCH_HIDDEN_STEMS[branch] || [];
  return hidden.map((h) => h.stem).join("");
}

// 신살 판정 — 대표 6종
export function computeSinsal(pillars: Pillars, hasHour: boolean): string[] {
  const dayStem = pillars.day.stem;
  const yearBr = pillars.year.branch;
  const dayBr = pillars.day.branch;
  const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch];
  if (hasHour && pillars.hour) branches.push(pillars.hour.branch);
  const branchSet = new Set(branches);

  const found: string[] = [];

  const che = CHEONEUL_MAP[dayStem] || [];
  if (che.some((b) => branchSet.has(b))) found.push("천을귀인");

  const checkBranchBased = (map: Record<string, string>, label: string) => {
    const t1 = map[yearBr];
    const t2 = map[dayBr];
    if ((t1 && branchSet.has(t1)) || (t2 && branchSet.has(t2))) found.push(label);
  };
  checkBranchBased(DOHWA_MAP, "도화살");
  checkBranchBased(YEOKMA_MAP, "역마살");
  checkBranchBased(HWAGAE_MAP, "화개살");

  const mun = MUNCHANG_MAP[dayStem];
  if (mun && branchSet.has(mun)) found.push("문창귀인");

  const yang = YANGIN_MAP[dayStem];
  if (yang && branchSet.has(yang)) found.push("양인살");

  return found;
}

export function getYearPillarOf(year: number): { hangul: string; hanja: string } {
  const result = calculateSaju(year, 6, 15, 12, 0);
  return { hangul: result.yearPillar, hanja: result.yearPillarHanja ?? "" };
}

// 월별 월건(月建) 간지 — 올해운세 상품용. 절기 경계를 피해 매월 15일 기준.
export function getMonthlyPillars(year: number): { month: number; hangul: string }[] {
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const r = calculateSaju(year, m, 15, 12, 0);
    return { month: m, hangul: r.monthPillar };
  });
}

export function computeAll(input: SajuInput): SajuResult {
  // 1. 음력 → 양력 변환
  let { year, month, day } = input;
  const { hourValue, isLunar, isLeap } = input;
  if (isLunar) {
    const solar = lunarToSolar(year, month, day, !!isLeap) as {
      year?: number; month?: number; day?: number;
      solar?: { year: number; month: number; day: number };
    };
    year = solar.year ?? solar.solar!.year;
    month = solar.month ?? solar.solar!.month;
    day = solar.day ?? solar.solar!.day;
  }

  // 2. 만세력 호출 (시간 모름이면 정오 기준으로 호출하되 시주는 버림)
  const hasHour = hourValue !== "unknown";
  const hour = hasHour ? Number(hourValue) : 12;
  const saju = calculateSaju(year, month, day, hour, 0);

  // 3. 4주(柱) 구조화
  const pillars: Pillars = {
    year: { hangul: saju.yearPillar, hanja: saju.yearPillarHanja, stem: saju.yearPillar[0], branch: saju.yearPillar[1] },
    month: { hangul: saju.monthPillar, hanja: saju.monthPillarHanja, stem: saju.monthPillar[0], branch: saju.monthPillar[1] },
    day: { hangul: saju.dayPillar, hanja: saju.dayPillarHanja, stem: saju.dayPillar[0], branch: saju.dayPillar[1] },
    hour: hasHour && saju.hourPillar
      ? { hangul: saju.hourPillar, hanja: saju.hourPillarHanja ?? "", stem: saju.hourPillar[0], branch: saju.hourPillar[1] }
      : null,
  };

  // 4. 일간
  const dayStem = pillars.day.stem;
  const dayMaster = {
    char: dayStem,
    element: STEM_ELEMENT[dayStem],
    yinyang: (STEM_YINYANG[dayStem] === "양" ? "陽" : "陰") as "陽" | "陰",
  };

  // 5. 오행 분포 (지장간 가중치 반영)
  const stemsArr = [pillars.year.stem, pillars.month.stem, pillars.day.stem];
  const brsArr = [pillars.year.branch, pillars.month.branch, pillars.day.branch];
  if (hasHour && pillars.hour) {
    stemsArr.push(pillars.hour.stem);
    brsArr.push(pillars.hour.branch);
  }
  const elementDist = computeOhaengDistribution(stemsArr, brsArr);

  // 6. 십신 (일간 제외 나머지 7글자, 지지는 본기 기준)
  const sipsinTargets: { position: string; char: string; isStem: boolean }[] = [
    { position: "년간", char: pillars.year.stem, isStem: true },
    { position: "년지", char: pillars.year.branch, isStem: false },
    { position: "월간", char: pillars.month.stem, isStem: true },
    { position: "월지", char: pillars.month.branch, isStem: false },
    { position: "일지", char: pillars.day.branch, isStem: false },
  ];
  if (hasHour && pillars.hour) {
    sipsinTargets.push({ position: "시간", char: pillars.hour.stem, isStem: true });
    sipsinTargets.push({ position: "시지", char: pillars.hour.branch, isStem: false });
  }
  const sipsin: SipsinEntry[] = sipsinTargets.map((t) => ({
    position: t.position,
    char: t.char,
    label: deriveSipsin(dayStem, t.char, t.isStem),
  }));

  // 7. 신살 (대표 6종)
  const sinsal = computeSinsal(pillars, hasHour);

  // 8. 십신 가중치 → 별점 (결정론적 사전계산)
  const sipsinWeights = computeSipsinWeights(pillars, hasHour, dayStem);
  const ratings = computeRatings(sipsinWeights, sinsal);

  // 9. 세운 (현재 년도 간지)
  const currentYear = new Date().getFullYear();
  const currentYearPillar = getYearPillarOf(currentYear);

  // 10. 전문 데이터 (4주 각각의 12운성/납음/지장간/12신살 + 공망 + 형충합)
  const positions = ["hour", "day", "month", "year"] as const;
  const expert: ExpertPillarRow[] = positions.map((pos) => {
    if (pos === "hour" && !pillars.hour) {
      return {
        pos, hangul: "미상", hanja: "―", stem: "", branch: "",
        stemSipsin: "―", branchSipsin: "―", jijanggan: "―",
        unseong: "―", naeum: "―", sinsal12: "―",
      };
    }
    const pl = pillars[pos]!;
    const stemLabel = pos === "day" ? "일원(나)" : deriveSipsin(dayStem, pl.stem, true);
    return {
      pos,
      hangul: pl.hangul,
      hanja: pl.hanja,
      stem: pl.stem,
      branch: pl.branch,
      stemSipsin: stemLabel,
      branchSipsin: deriveSipsin(dayStem, pl.branch, false),
      jijanggan: getJijangganStr(pl.branch),
      unseong: get12Unseong(dayStem, pl.branch),
      naeum: getNaeum(pl.stem, pl.branch),
      sinsal12: get12Sinsal(pillars.year.branch, pl.branch) || "―",
    };
  });
  const gongmang = getGongmang(dayStem, pillars.day.branch);
  const branchesAll = [pillars.year.branch, pillars.month.branch, pillars.day.branch];
  if (hasHour && pillars.hour) branchesAll.push(pillars.hour.branch);
  const relations = detectJijiRelations(branchesAll);
  const expertExtra = {
    공망: gongmang,
    형충합: relations,
    월령: pillars.month.branch,
    천을위치: (CHEONEUL_MAP[dayStem] || []).filter((b) => new Set(branchesAll).has(b)),
  };

  return {
    pillars, dayMaster, elementDist, sipsin, sipsinWeights,
    sinsal, ratings, hasHour, currentYear, currentYearPillar,
    expert, expertExtra,
  };
}

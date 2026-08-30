// 절입(節入) 시각 보정 — 만세력 라이브러리의 "날짜 단위" 월 경계 판정을 시각 단위로 교정한다.
//
// 배경 (2026-08-25 교차검증, docs/saju-skills-benchmark.md):
// @fullstackfamily/manseryeok은 절입일 00:00부터 새 달(月)로 귀속시킨다.
// → 매년 12개 절입일에 절입 "시각 이전" 출생자는 월주가 틀리고,
//   입춘일에는 연주와 대운 방향까지 통째로 틀어진다.
//
// 테이블: lunar-javascript(중국표준시)에서 추출 후 +1h(KST) 변환한 1900~2050 절입 시각.
// 2024 입춘 17:27 KST가 한국천문연구원 발표값과 일치함을 확인했다.
// ±1~2분 오차 가능성은 남는다 — 절입 시각이 출생 시진 슬롯 안에 있으면 ambiguous로 표시.

import rawTable from "./jeolip-table.json";

// JSON 임포트는 string[][]로 넓게 추론되므로 unknown 경유 캐스트가 필요하다 (내용은 [일시, 간지] 쌍 고정)
const TABLE = rawTable as unknown as Record<string, [string, string][]>;

export interface JeolipInfo {
  /** 날짜 단위 판정을 시각 기준으로 되돌려 월주(±연주)를 보정했는가 */
  adjusted: boolean;
  /** 절입 시각이 출생 시진 슬롯 내부(또는 시간 미상)라 원리적으로 판별 불가 */
  ambiguous: boolean;
  term?: string;      // 절입 이름 (입춘·경칩·…)
  termTime?: string;  // KST "YYYY-MM-DDTHH:mm"
}

const pad = (n: number) => String(n).padStart(2, "0");

/** 출생 시진 슬롯의 대표 시각(HH:mm). 슬롯 중앙값 — 진태양시 :30 경계 컨벤션과 정합. */
export function slotRepTime(hourValue: string): string {
  if (hourValue === "unknown") return "12:00";
  if (hourValue === "23") return "23:45"; // 야자시 23:30~24:00
  if (hourValue === "0") return "00:45";  // 조자시 00:00~01:30
  return `${pad(Number(hourValue))}:30`;  // 짝수 슬롯: (v-1):30~(v+1):30의 중앙
}

/** 출생 시진 슬롯의 [시작, 끝) — 같은 날짜 안에서만 (자시의 전일 23:30 구간은 야자시 슬롯이 담당) */
function slotRange(hourValue: string): [string, string] | null {
  if (hourValue === "unknown") return null;
  if (hourValue === "23") return ["23:30", "24:00"];
  if (hourValue === "0") return ["00:00", "01:30"];
  const v = Number(hourValue);
  return [`${pad(v - 1)}:30`, `${pad(v + 1)}:30`];
}

/** 해당 양력 날짜가 절입일이면 그 절입을 반환 */
export function findTermOnDate(year: number, month: number, day: number): { name: string; iso: string } | null {
  const entries = TABLE[String(year)];
  if (!entries) return null;
  const prefix = `${year}-${pad(month)}-${pad(day)}`;
  const hit = entries.find(([, iso]) => iso.startsWith(prefix));
  return hit ? { name: hit[0], iso: hit[1] } : null;
}

/** compIso(KST) 기준 직전·직후 절입 — 대운수 정밀 계산용 */
export function nearestTerms(compIso: string): { prev: { name: string; iso: string } | null; next: { name: string; iso: string } | null } {
  const year = Number(compIso.slice(0, 4));
  const pool: [string, string][] = [];
  for (const y of [year - 1, year, year + 1]) {
    const e = TABLE[String(y)];
    if (e) pool.push(...e);
  }
  pool.sort((a, b) => (a[1] < b[1] ? -1 : 1));
  let prev: [string, string] | null = null;
  let next: [string, string] | null = null;
  for (const e of pool) {
    if (e[1] <= compIso) prev = e;
    else { next = e; break; }
  }
  return {
    prev: prev ? { name: prev[0], iso: prev[1] } : null,
    next: next ? { name: next[0], iso: next[1] } : null,
  };
}

const MS_PER_DAY = 86_400_000;

function isoToMs(iso: string): number {
  // "YYYY-MM-DDTHH:mm" — KST 문자열끼리의 차이만 쓰므로 UTC로 취급해도 무방
  const [d, t] = iso.split("T");
  const [y, m, dd] = d.split("-").map(Number);
  const [h, mi] = t.split(":").map(Number);
  return Date.UTC(y, m - 1, dd, h, mi);
}

/** 대운수(일수/3, 반올림, 1~10 클램프) — 절입 시각 테이블 기반 정밀값 */
export function preciseDaewoonAge(compIso: string, forward: boolean): number | null {
  const { prev, next } = nearestTerms(compIso);
  const target = forward ? next : prev;
  if (!target) return null;
  const days = Math.abs(isoToMs(target.iso) - isoToMs(compIso)) / MS_PER_DAY;
  return Math.min(10, Math.max(1, Math.round(days / 3)));
}

/**
 * 절입일 출생 보정 판단.
 * 반환: 보정 필요 여부(월주 -1, 입춘이면 연주도 -1)와 판별 신뢰도.
 */
export function checkJeolip(
  year: number, month: number, day: number, hourValue: string,
): JeolipInfo & { needShift: boolean; isIpchun: boolean; compIso: string } {
  const compIso = `${year}-${pad(month)}-${pad(day)}T${slotRepTime(hourValue)}`;
  const term = findTermOnDate(year, month, day);
  if (!term) return { adjusted: false, ambiguous: false, needShift: false, isIpchun: false, compIso };

  const needShift = compIso < term.iso; // 절입 전 출생 → 라이브러리의 새 달 귀속을 되돌린다
  const range = slotRange(hourValue);
  const termHm = term.iso.slice(11);
  const ambiguous = range === null // 시간 미상: 정오 가정이므로 판별 신뢰 낮음
    ? true
    : termHm >= range[0] && termHm < range[1]; // 절입이 슬롯 내부 → 슬롯 입력으로는 판별 불가

  return {
    adjusted: needShift,
    ambiguous,
    term: term.name,
    termTime: term.iso,
    needShift,
    isIpchun: term.name === "입춘",
    compIso,
  };
}

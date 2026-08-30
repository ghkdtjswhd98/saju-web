// 오행 상생상극 기반 일간 궁합 매핑 — 정적 규칙 (AI 호출 없음)
//
// ⚠️ 반드시 결정론적 매핑이어야 한다. LLM으로 만들면 같은 일간인데 결과가
// 매번 달라져 "유형"으로서의 정체성이 무너진다(재미 조사 2026-08-12 결론).
// 근거는 전통 오행 이론의 상생(相生)·상극(相剋) 순환뿐 — 지어낸 점수 없음.

// 상생: 목→화→토→금→수→목 (앞이 뒤를 살린다)
const CYCLE = ["목", "화", "토", "금", "수"] as const;
type Ohaeng = (typeof CYCLE)[number];

// 오행별 일간 (천간 2개씩)
export const OHAENG_STEMS: Record<Ohaeng, [string, string]> = {
  목: ["갑목", "을목"],
  화: ["병화", "정화"],
  토: ["무토", "기토"],
  금: ["경금", "신금"],
  수: ["임수", "계수"],
};

const OHAENG_WORD: Record<Ohaeng, string> = {
  목: "나무", 화: "불", 토: "흙", 금: "쇠", 수: "물",
};

export interface OhaengAffinity {
  /** 나를 살려주는 오행 (상생에서 나를 생하는 쪽) */
  feeds: Ohaeng;
  /** 내가 살려주는 오행 */
  fedBy: Ohaeng;
  /** 나를 누르는 오행 (상극에서 나를 극하는 쪽) */
  presses: Ohaeng;
  /** 표시용 문장 재료 */
  feedsLabel: string; // "물 기운 (임수·계수)"
  pressesLabel: string;
}

export function getOhaengAffinity(myElement: string): OhaengAffinity | null {
  const i = CYCLE.indexOf(myElement as Ohaeng);
  if (i < 0) return null;
  const at = (n: number) => CYCLE[((n % 5) + 5) % 5];
  const feeds = at(i - 1); // 나를 생하는 오행
  const fedBy = at(i + 1); // 내가 생하는 오행
  const presses = at(i - 2); // 나를 극하는 오행 (X를 극하는 것은 두 칸 앞)
  const label = (o: Ohaeng) => `${OHAENG_WORD[o]} 기운 (${OHAENG_STEMS[o].join("·")})`;
  return {
    feeds, fedBy, presses,
    feedsLabel: label(feeds),
    pressesLabel: label(presses),
  };
}

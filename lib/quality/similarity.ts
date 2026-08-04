// 리포트 개인화 품질 측정 — 순수 함수. DB도 네트워크도 모른다.
//
// 오롭미 최대 실패 모드는 "해석이 부실하다"가 아니라 "남과 결과가 똑같다"이다.
// 이용자는 친구와 대조하거나 생년월일만 바꿔 재실행하는 자체 검증을 실제로 하고,
// 그 검증을 통과하지 못하면 반응이 "재미없다"가 아니라 "사기"가 된다.
// 이 파일은 그 위험을 사람 눈이 아니라 숫자로 잡기 위한 도구다.

const GRAM = 3;

// 이름·숫자를 지우는 게 이 도구의 핵심 판단이다.
// 이름이 다르면 그것만으로 유사도가 떨어져, 정작 잡아야 할 문장 템플릿 재사용이 가려진다.
export function normalizeForCompare(text: string): string {
  return text
    .replace(/[가-힣]{1,4}님/g, "") // "지민님" 같은 호명 제거
    .replace(/[0-9]+/g, "") // 나이·연도 제거
    .replace(/[^가-힣a-z]/gi, ""); // 공백·문장부호·기호 제거
}

function grams(text: string): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i + GRAM <= text.length; i++) out.add(text.slice(i, i + GRAM));
  return out;
}

/** 두 텍스트의 문자 3-gram 자카드 유사도 (0~1). 형태소 분석 없이 템플릿 재사용을 잡는다. */
export function similarity(a: string, b: string): number {
  const ga = grams(normalizeForCompare(a));
  const gb = grams(normalizeForCompare(b));
  if (ga.size === 0 || gb.size === 0) return 0;

  let shared = 0;
  const [small, large] = ga.size <= gb.size ? [ga, gb] : [gb, ga];
  for (const g of small) if (large.has(g)) shared++;

  return shared / (ga.size + gb.size - shared);
}

export interface SimilarPair {
  a: string;
  b: string;
  score: number;
}

/** 모든 쌍의 유사도를 점수 내림차순으로 반환. */
export function pairwiseSimilarity(items: { id: string; text: string }[]): SimilarPair[] {
  const pairs: SimilarPair[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      pairs.push({
        a: items[i].id,
        b: items[j].id,
        score: similarity(items[i].text, items[j].text),
      });
    }
  }
  return pairs.sort((x, y) => y.score - x.score);
}

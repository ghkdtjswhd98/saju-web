// 프롬프트에서 금지한 표현이 실제 출력에 나왔는지 검사하는 순수 함수.
//
// ⚠️ 동기화 주의: 금지 규칙의 출처는 lib/prompts/formats.ts의 ANTI_CLICHE와 PAID_COMMON이다.
// 그쪽은 모델에게 주는 "지시"이고 이쪽은 결과를 검사하는 "감사"라 역할이 다르지만,
// 규칙을 추가·수정할 때는 양쪽을 함께 손봐야 한다.

export interface ClicheHit {
  rule: string;
  excerpt: string;
}

// 십신 명칭 — 본문에 단 한 번도 나오면 안 된다 (일상 언어로 풀어 써야 함)
const SIPSIN = ["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"];

// 한 번만 나와도 실패인 규칙
const HARD_RULES: { rule: string; re: RegExp }[] = [
  {
    // 무료 결과 3건이 전부 이 구조로 수렴했던 실패 패턴 (2026-08-05 평가).
    // "화력"은 실데이터에서 이 규칙을 우회한 변형이라 추가했다.
    rule: "겉속대비",
    re: /겉(은|으로는|으론)[^.!?]{0,40}(차분|고요|조용|무던|담백)[^.!?]{0,40}속(은|으로는|엔|에는)[^.!?]{0,40}(열정|야망|불꽃|뜨거|욕심|화력)/,
  },
  {
    // 나열형 성격 서술만 잡는다. 같은 어휘라도 "생각이 많아지면서 실행을 미룬다"처럼
    // 메커니즘을 설명하는 문장은 정당한 진단이므로 오탐하지 않아야 한다.
    rule: "진부성격서술",
    re: /(생각이 많(은 편|은 타입|은 사람|고)|정이 많(은|고)|책임감이 강(한|하고)|성실하고 꼼꼼)/,
  },
  {
    rule: "남앞뒤반전",
    re: /남 앞에선[^.!?]{0,30}(신중|조심)[^.!?]{0,30}혼자[^.!?]{0,20}(과감|대담)/,
  },
];

// 횟수 초과부터 실패인 규칙
const COLD_READ = /[^.!?]{0,20}적 있죠\?|[^.!?]{0,20}들었을 거예요/g;
const COLD_READ_LIMIT = 2;

function excerptAround(text: string, index: number, len = 40): string {
  const start = Math.max(0, index - 10);
  return text.slice(start, start + len).trim();
}

export function findCliches(text: string): ClicheHit[] {
  const hits: ClicheHit[] = [];

  for (const { rule, re } of HARD_RULES) {
    const m = re.exec(text);
    if (m) hits.push({ rule, excerpt: excerptAround(text, m.index) });
  }

  for (const term of SIPSIN) {
    const idx = text.indexOf(term);
    if (idx >= 0) {
      hits.push({ rule: "전문용어", excerpt: excerptAround(text, idx) });
      break; // 하나만 나와도 실패라 첫 건만 보고
    }
  }

  const colds = text.match(COLD_READ) ?? [];
  if (colds.length > COLD_READ_LIMIT) {
    hits.push({ rule: "콜드리딩남발", excerpt: `${colds.length}회: ${colds.slice(0, 3).join(" / ")}` });
  }

  return hits;
}

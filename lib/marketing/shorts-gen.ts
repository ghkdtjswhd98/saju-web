// 띠별 숏폼 대본 생성 공용 로직 — CLI(scripts/generate-shorts.ts)와 관리자 페이지가 함께 쓴다.
// 훅 공식: [0-3초 띠 지목] → [올해 기운 긴장] → [실제 지지관계 근거 풀이] → [댓글 키워드 CTA]
import { detectJijiRelations } from "@/lib/saju/compute";
import type { Product } from "@/lib/products";

export interface Tti {
  key: string;
  name: string;
  branch: string;
  emoji: string;
}

export const TTIS: Tti[] = [
  { key: "rat", name: "쥐띠", branch: "자", emoji: "🐀" },
  { key: "ox", name: "소띠", branch: "축", emoji: "🐂" },
  { key: "tiger", name: "호랑이띠", branch: "인", emoji: "🐅" },
  { key: "rabbit", name: "토끼띠", branch: "묘", emoji: "🐇" },
  { key: "dragon", name: "용띠", branch: "진", emoji: "🐉" },
  { key: "snake", name: "뱀띠", branch: "사", emoji: "🐍" },
  { key: "horse", name: "말띠", branch: "오", emoji: "🐎" },
  { key: "sheep", name: "양띠", branch: "미", emoji: "🐑" },
  { key: "monkey", name: "원숭이띠", branch: "신", emoji: "🐒" },
  { key: "rooster", name: "닭띠", branch: "유", emoji: "🐓" },
  { key: "dog", name: "개띠", branch: "술", emoji: "🐕" },
  { key: "pig", name: "돼지띠", branch: "해", emoji: "🐖" },
];

export const THIS_YEAR = 2026;
export const YEAR_BRANCH = "오"; // 병오년
export const YEAR_LABEL = "병오년";

export const CTA_KEYWORD: Record<string, string> = {
  year: "남은운", reunion: "재회", marriage: "결혼운", dohwa: "도화",
  crush: "속마음", love: "궁합", career: "재물", lifetime: "내팔자", deep: "심층",
};

export const TONES: Record<string, { label: string; prompt: string }> = {
  dosa: {
    label: "도사 반말",
    prompt: `말투: 젊은 도사 컨셉. 반말, 짧고 단호한 문장, 혼내듯 직설적이지만 결국 챙겨주는 톤.
예: "개띠. 스크롤 멈춰라. 올해 너한테 들어온 기운, 이거 모르고 지나가면 아깝다."`,
  },
  eonni: {
    label: "친한 언니",
    prompt: `말투: 사주 잘 보는 친한 언니 컨셉. 반말, 수다 떨듯 자연스럽게, 핵심은 콕 집는 톤.
예: "얘 쥐띠들아, 올해 왜 이렇게 마음이 붕 뜨는지 알려줄게."`,
  },
};

export const CONTENT_GUARDRAILS = `# 오롭미 콘텐츠 가드레일 (위반 시 실패)
- 낙인·저주·공포 금지: "삼재라 큰일난다", "액운이 낀다", 질병·사고·죽음 언급 금지.
- 가짜 시한 금지: 날짜를 쓰려면 실제 절기·명절·월말 등 실재하는 날만. 지어내지 말 것.
- 확정 예언 금지: "~된다" 단정 대신 "~하기 쉬운 흐름", "~가 들어오는 해" 같은 경향의 언어.
- 근거 없는 말 금지: 제공된 지지 관계(합·충·형·해·파)에서만 운세 서사를 끌어낼 것.
- 전문용어는 딱 하나만 허용: 관계 이름(충/합/형)은 "부딪히는 기운", "끌어주는 기운"처럼 풀어 쓰되,
  후킹용으로 "충이 들어온다" 정도의 한 단어 노출은 허용.
- 반말·직설은 허용 (콘텐츠 컨셉). 비하·욕설·조롱은 금지.
- 과장 수치 금지: 조회수·판매량·적중률 등 숫자를 지어내지 말 것.`;

/** 띠 지지와 올해 지지의 실제 관계 — 콘텐츠의 결정론적 근거 */
export function ttiYearRelation(tti: Tti): string {
  const rel = detectJijiRelations([tti.branch, YEAR_BRANCH]);
  const hits: string[] = [];
  for (const [kind, arr] of Object.entries(rel)) {
    for (const item of arr) hits.push(`${item}(${kind})`);
  }
  const HAE: Record<string, string> = { 축: "축오해" };
  const PA: Record<string, string> = { 묘: "묘오파" };
  if (HAE[tti.branch]) hits.push(`${HAE[tti.branch]}(해)`);
  if (PA[tti.branch]) hits.push(`${PA[tti.branch]}(파)`);
  return hits.length ? hits.join(", ") : "특별한 형충합 없음 (평탄한 흐름)";
}

export function buildShortsSystem(keyword: string): string {
  return `당신은 사주 콘텐츠 전문 숏폼 작가입니다. 오롭미(만세력 기반 AI 사주 리포트 서비스)의 릴스/쇼츠/틱톡 대본을 씁니다.

${CONTENT_GUARDRAILS}

# 숏폼 규격 (엄격)
- 총 20~30초 분량. 첫 3초 안에 비주얼 훅 + 멘트 훅 + 화면 텍스트 훅이 동시에 터져야 함.
- 구조: [0-3초 띠 지목 훅] → [3-10초 올해 기운의 긴장] → [10-25초 근거 있는 풀이] → [25-30초 CTA].
- 자막: 한 번에 최대 2줄, 줄당 3~5어절. 말과 정확히 동기화.
- CTA는 반드시 "댓글에 ${keyword} 남겨" + "프로필 링크" 두 가지를 자연스럽게.
- 풀이의 근거는 반드시 제공된 실제 지지 관계에서만. 관계가 "없음"이면 그것대로 평탄·안정 서사로.

# 출력 형식 (마크다운, 정확히 이 구조)
## 훅 (0-3초)
- 비주얼: [첫 프레임 화면 지시 1줄]
- 멘트: [첫 문장]
- 화면텍스트: [큰 자막 1줄, 8자 이내]

## 대본 (타임코드)
[0-3s] ...
[3-10s] ...
[10-25s] ...
[25-30s] ...

## 자막 (줄단위, CapCut 복붙용)
[한 줄에 3~5어절씩, 대본 전체를 순서대로]

## 캡션
[2~3문장 + 해시태그 5개]

## 댓글 고정용
[업로드 직후 작성자가 달아둘 고정 댓글 1개 — CTA 반복]`;
}

export function buildShortsUser(tti: Tti, product: Product, tone: string): string {
  const keyword = CTA_KEYWORD[product.code] ?? "운세";
  return `띠: ${tti.name} (${tti.branch})
올해: ${THIS_YEAR}년 ${YEAR_LABEL}
이 띠와 올해 지지의 실제 관계 (만세력 계산): ${ttiYearRelation(tti)}
연결 상품: ${product.name} — ${product.tagline} (카드 제목: "${product.cardTitle}")
댓글 CTA 키워드: ${keyword}
${TONES[tone]?.prompt ?? TONES.dosa.prompt}

위 정보로 ${tti.name} 대상 숏폼 대본 1개를 작성하세요. 상품 이름을 대본에서 직접 팔지 말고(광고 티 금지), "더 깊은 건 프로필에서"의 결로만 연결하세요.`;
}

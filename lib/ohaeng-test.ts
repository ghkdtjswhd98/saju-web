// 오행 캐릭터 테스트 — AI 호출 없는 결정론적 12문항 (유입 엔진, 비용 0원)
// 각 선택지는 오행 1개에 +1. 동점이면 목→화→토→금→수 순서에서 먼저 나온 쪽.

export type ElementKey = "wood" | "fire" | "earth" | "metal" | "water";

export interface OhaengType {
  key: ElementKey;
  hanja: string; // 木火土金水
  korean: string; // 목화토금수
  name: string; // 캐릭터명
  emoji: string;
  color: string;
  tagline: string;
  description: string[];
  strengths: string[];
  watchout: string;
  matchKey: ElementKey; // 상생 관계(나를 자라게 하는 기운)
  matchReason: string;
}

export const OHAENG_TYPES: Record<ElementKey, OhaengType> = {
  wood: {
    key: "wood",
    hanja: "木",
    korean: "목",
    name: "쭉쭉 자라는 새싹형",
    emoji: "🌱",
    color: "#6a9f6a",
    tagline: "멈춰 있으면 시드는 사람",
    description: [
      "새로운 걸 보면 심장이 먼저 반응해요. 배우고 싶고, 해보고 싶고, 가보고 싶은 게 늘 리스트로 쌓여 있죠.",
      "어제의 나보다 조금이라도 자란 느낌이 없으면 답답해지는 타입. 안정적이기만 한 일상은 오히려 시들해져요.",
      "넘어져도 금방 다시 싹을 틔우는 회복력이 최고 무기예요.",
    ],
    strengths: ["추진력", "호기심", "회복탄력성"],
    watchout: "벌여놓은 일을 마무리하기 전에 새 일부터 시작하는 버릇은 의식해보세요.",
    matchKey: "water",
    matchReason: "물이 나무를 키우듯(水生木), 바다형이 곁에 있으면 더 크게 자라요.",
  },
  fire: {
    key: "fire",
    hanja: "火",
    korean: "화",
    name: "심장부터 뜨거운 불꽃형",
    emoji: "🔥",
    color: "#d07b6a",
    tagline: "심장이 시키는 대로 사는 사람",
    description: [
      "좋아하는 건 온몸으로 티가 나요. 표정, 말투, 텐션 — 숨기려 해도 숨겨지지 않는 타입.",
      "사람들 사이에 있으면 자연스럽게 중심이 되고, 당신이 빠진 모임은 어딘가 심심하다는 말을 들어요.",
      "한번 꽂히면 무섭게 몰입하는 에너지가 최고 무기예요.",
    ],
    strengths: ["표현력", "몰입", "사람을 끌어당기는 힘"],
    watchout: "확 타올랐다가 빨리 식는 패턴이 반복된다면, 불씨를 오래 지키는 연습을 해보세요.",
    matchKey: "wood",
    matchReason: "나무가 불을 지피듯(木生火), 새싹형이 곁에 있으면 더 오래 타올라요.",
  },
  earth: {
    key: "earth",
    hanja: "土",
    korean: "토",
    name: "흔들림 없는 산맥형",
    emoji: "⛰️",
    color: "#c2a05e",
    tagline: "흔들리는 세상의 무게중심",
    description: [
      "친구들이 힘들 때 제일 먼저 찾는 사람이 바로 당신이에요. 뭘 해줘서가 아니라, 그냥 곁에 있어주는 것만으로 안심이 되니까.",
      "말이 앞서기보다 행동으로 보여주고, 한번 맺은 인연은 오래 지켜요.",
      "나이보다 어른스럽다는 말, 어릴 때부터 들었을 거예요.",
    ],
    strengths: ["신뢰", "꾸준함", "포용력"],
    watchout: "남들 챙기느라 정작 내 마음은 뒷전이 되기 쉬워요. 나를 먼저 챙기는 날도 필요해요.",
    matchKey: "fire",
    matchReason: "불이 흙을 데우듯(火生土), 불꽃형이 곁에 있으면 일상이 따뜻해져요.",
  },
  metal: {
    key: "metal",
    hanja: "金",
    korean: "금",
    name: "단호하게 빛나는 보석형",
    emoji: "💎",
    color: "#9aa3ad",
    tagline: "대충은 없다 — 할 거면 확실하게",
    description: [
      "맺고 끊음이 확실해요. 아닌 건 아니라고 말할 수 있고, 한번 결정하면 뒤돌아보지 않아요.",
      "일을 맡기면 마감 퀄리티가 다르다는 말을 들어요. 스스로의 기준이 세상의 기준보다 높은 타입.",
      "그 단단한 자기 기준이 당신을 빛나게 하는 원석이에요.",
    ],
    strengths: ["결단력", "완성도", "자기 기준"],
    watchout: "그 높은 기준을 스스로에게만 너무 엄격하게 들이대지 마세요. 당신은 이미 충분히 잘하고 있어요.",
    matchKey: "earth",
    matchReason: "흙 속에서 보석이 나오듯(土生金), 산맥형이 곁에 있으면 더 편하게 빛나요.",
  },
  water: {
    key: "water",
    hanja: "水",
    korean: "수",
    name: "유연하게 스며드는 바다형",
    emoji: "🌊",
    color: "#6a86b8",
    tagline: "부드럽게 스며들어 결국 다 통하는 사람",
    description: [
      "사람들이 당신 앞에서는 이상하게 속얘기를 하게 된다고 해요. 판단하지 않고 끝까지 들어주는 힘이 있으니까.",
      "정면돌파보다는 물처럼 돌아가는 길을 찾는 타입. 부딪히지 않고도 원하는 곳에 도착해요.",
      "말로 설명 못 해도 뭔가 '느낌이 오는' 직관이 최고 무기예요.",
    ],
    strengths: ["공감력", "직관", "유연함"],
    watchout: "다 들어주면서 정작 내 속마음은 잘 안 보여주는 편이에요. 가끔은 먼저 꺼내보세요.",
    matchKey: "metal",
    matchReason: "바위틈에서 샘이 솟듯(金生水), 보석형이 곁에 있으면 마음이 마르지 않아요.",
  },
};

export const TYPE_ORDER: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];

export interface Question {
  q: string;
  options: { text: string; element: ElementKey }[];
}

// 12문항 × 3선택지 = 36슬롯 (목6 화7 토7 금8 수8)
export const QUESTIONS: Question[] = [
  {
    q: "갑자기 내일 하루 휴가가 생겼다!",
    options: [
      { text: "바로 친구들 소집, 재밌는 거 하러 간다", element: "fire" },
      { text: "완벽한 집콕 — 침대에서 한 발짝도 안 나감", element: "water" },
      { text: "미뤄뒀던 원데이 클래스나 배우고 싶던 거 도전", element: "wood" },
    ],
  },
  {
    q: "단톡방 여행 계획이 산으로 가고 있을 때 나는",
    options: [
      { text: "일단 정리해서 표로 만든다. 어느새 내가 총무", element: "earth" },
      { text: "\"뭐 어때, 일단 가자!\" 분위기 띄우는 쪽", element: "fire" },
      { text: "예산이랑 동선 따져서 현실적인 안을 제시", element: "metal" },
    ],
  },
  {
    q: "처음 만난 사람들과의 모임에서 나는",
    options: [
      { text: "먼저 말 걸고 분위기 만드는 편", element: "fire" },
      { text: "조용히 관찰하다 한 명이랑 깊은 얘기 중", element: "water" },
      { text: "리액션 담당 — 편안한 분위기는 내가 만든다", element: "earth" },
    ],
  },
  {
    q: "스트레스가 쌓이면 나는",
    options: [
      { text: "운동이든 산책이든 몸을 움직여야 풀린다", element: "wood" },
      { text: "혼자만의 시간 필수. 음악, 목욕, 침묵", element: "water" },
      { text: "원인을 분석해서 해결해야 직성이 풀린다", element: "metal" },
    ],
  },
  {
    q: "친구가 울면서 고민 상담을 하면",
    options: [
      { text: "일단 끝까지 들어준다. 판단은 안 해", element: "water" },
      { text: "현실적인 해결책을 정리해준다", element: "metal" },
      { text: "\"밥부터 먹자\" — 곁에 있어주는 게 내 위로", element: "earth" },
    ],
  },
  {
    q: "새로운 일을 시작할 때 나는",
    options: [
      { text: "일단 시작! 하면서 배우면 된다", element: "wood" },
      { text: "계획표랑 체크리스트부터 만든다", element: "metal" },
      { text: "재밌어 보이면 그날 밤새서 몰입한다", element: "fire" },
    ],
  },
  {
    q: "나의 쇼핑 스타일은",
    options: [
      { text: "첫눈에 꽂히면 바로 결제", element: "fire" },
      { text: "최저가·리뷰 비교 끝판왕", element: "metal" },
      { text: "장바구니에 넣고 며칠 재우면서 고민", element: "water" },
    ],
  },
  {
    q: "연애할 때 나는",
    options: [
      { text: "표현 부자 — 좋아하면 온 세상이 안다", element: "fire" },
      { text: "한결같음. 오래 볼수록 진가가 나오는 타입", element: "earth" },
      { text: "상대의 리듬에 맞춰 스며드는 스타일", element: "water" },
    ],
  },
  {
    q: "일할 때 나에게 제일 중요한 건",
    options: [
      { text: "내가 성장하고 있다는 감각", element: "wood" },
      { text: "안정적인 환경과 믿을 수 있는 동료", element: "earth" },
      { text: "결과물의 완성도, 그리고 인정", element: "metal" },
    ],
  },
  {
    q: "계획이 갑자기 틀어졌을 때 나는",
    options: [
      { text: "뭐 어때, 흘러가는 대로 가보자", element: "water" },
      { text: "스트레스… 바로 플랜 B를 세운다", element: "metal" },
      { text: "오히려 좋아 — 새로운 기회일지도?", element: "wood" },
    ],
  },
  {
    q: "친구들이 말하는 나는",
    options: [
      { text: "\"네가 있으면 그냥 든든해\"", element: "earth" },
      { text: "\"너랑 있으면 심심할 틈이 없어\"", element: "fire" },
      { text: "\"너한테는 이상하게 뭐든 말하게 돼\"", element: "water" },
    ],
  },
  {
    q: "10년 뒤 내가 바라는 나의 모습은",
    options: [
      { text: "여전히 새로운 걸 시도하고 있는 사람", element: "wood" },
      { text: "내 분야에서 확실하게 인정받는 전문가", element: "metal" },
      { text: "사랑하는 사람들과 평온하고 단단한 일상", element: "earth" },
    ],
  },
];

// 결과 계산 — 동점 시 TYPE_ORDER 순서 우선 (결정론적)
export function scoreAnswers(answers: ElementKey[]): { main: ElementKey; sub: ElementKey } {
  const counts: Record<ElementKey, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const a of answers) counts[a]++;
  const sorted = [...TYPE_ORDER].sort((a, b) => counts[b] - counts[a]);
  return { main: sorted[0], sub: sorted[1] };
}

export function isElementKey(v: string): v is ElementKey {
  return TYPE_ORDER.includes(v as ElementKey);
}

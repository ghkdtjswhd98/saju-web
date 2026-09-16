// 명절 시즌 문구 레이어 — 케미 초대 화면의 카피를 달력 날짜에 맞춰 바꾼다.
//
// 왜 필요한가: 케미 링크는 "혼자 만들고 혼자 보는" 기능이 아니라 단톡방에 던져야 굴러간다.
// 그 단톡방이 1년에 두 번 저절로 만들어지는 날이 명절이다. 기능은 그대로 두고 문구만 바꾼다.
//
// ⚠️ 규칙 두 가지
//  1) 날짜는 실제 달력(추석 연휴)만 쓴다. lib/launch.ts와 같은 원칙 — 가짜 시즌·가짜 마감 금지.
//  2) 문구는 긍정만. 케미 점수는 58~96 구간이라 꼴찌도 웃고 넘길 수 있게 만들어 뒀는데,
//     "누가 나랑 안 맞나" 같은 서열 비하 카피를 붙이면 그 설계가 무너진다 (season.test.ts가 감시).
//
// 기간이 지나면 currentSeason()이 null을 돌려주고 화면은 평상시 문구로 저절로 돌아간다 —
// 명절 끝나고 손으로 되돌리는 걸 잊어 "지난 추석" 문구가 박혀 있는 사고를 막기 위해서다.

export interface SeasonCopy {
  key: "chuseok";
  /** 화면 상단 작은 배지 */
  badge: string;
  /** /chemi 대문 H1 — 2줄로 끊어 쓴다 */
  homeTitle: [string, string];
  homeSub: string;
  /** /chemi 3단계 안내 중 "링크 올리기" 단계 설명 */
  stepShareDesc: string;
  /** 링크 주인 화면의 공유 버튼 아래 한 줄 */
  ownerShareHint: string;
  /** 친구 랜딩 상단 작은 글씨 */
  friendKicker: string;
  metaTitle: string;
  metaDescription: string;
}

// 2026년 추석 연휴는 9/24(목)~9/26(토), 당일은 9/25.
// 연휴 일주일 전부터(모임 이야기가 오가기 시작) 연휴 이틀 뒤까지 — 한국시간 자정 경계.
export const CHUSEOK_2026 = {
  start: new Date("2026-09-16T15:00:00Z"), // 2026-09-17 00:00 KST
  end: new Date("2026-09-28T14:59:59.999Z"), // 2026-09-28 23:59:59 KST
} as const;

const CHUSEOK_COPY: SeasonCopy = {
  key: "chuseok",
  badge: "추석 한정",
  homeTitle: ["명절에 모인 가족,", "누가 나랑 제일 잘 맞을까?"],
  homeSub: "링크 하나면 가족 단톡방에 케미 순위가 쌓여요",
  stepShareDesc: "가족 단톡방에 링크만 올리면 돼요. 어른들도 생일만 넣으면 끝.",
  ownerShareHint: "추석 가족 단톡방에 이 링크 하나만 올려보세요",
  friendKicker: "추석 가족 케미",
  metaTitle: "추석 가족 케미 순위 — 우리 집에서 누가 나랑 제일 잘 맞을까?",
  metaDescription:
    "링크를 보내면 가족은 생일만 넣어요. 누가 나랑 제일 잘 맞는지 케미 순위가 쌓여요. 회원가입·로그인 없음.",
};

/** 지금 켜져 있는 시즌 문구. 없으면 null — 호출부는 평상시 문구를 그대로 쓴다. */
export function currentSeason(now: Date = new Date()): SeasonCopy | null {
  const t = now.getTime();
  if (t >= CHUSEOK_2026.start.getTime() && t <= CHUSEOK_2026.end.getTime()) return CHUSEOK_COPY;
  return null;
}

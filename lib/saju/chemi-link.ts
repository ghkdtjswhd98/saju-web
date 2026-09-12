// 케미 초대 링크 — 라벨·순위 규칙 (순수 함수, DB 없음)
// 스펙(2026-08-17 오행 정원 4절): 전원 긍정 라벨. 꼴찌도 웃어넘길 수 있어야 관계가 상하지 않는다.

/** 점수(58~96) 구간별 긍정 한 줄 — 낮은 구간도 "나쁨"이 아니라 "알아갈수록 좋아짐"으로 말한다 */
export function chemiLabel(score: number): string {
  if (score >= 90) return "만나면 시간이 순삭되는 찰떡 케미";
  if (score >= 82) return "말 안 해도 통하는 사이";
  if (score >= 74) return "같이 있으면 마음이 편해지는 사이";
  if (score >= 66) return "서로 다른 점이 오히려 매력인 사이";
  return "알아갈수록 점점 좋아지는 사이";
}

/** 경쟁 순위(1224식) — 같은 점수는 같은 등수, 나보다 높은 점수 수 + 1 */
export function rankOf(scores: number[], myScore: number): number {
  return scores.filter((s) => s > myScore).length + 1;
}

/** 순위판 한 줄 */
export interface ChemiRankRow {
  nickname: string;
  score: number;
  label: string;
  rank: number;
}

/** 점수 내림차순(동점은 먼저 온 순) + 순위 부여 */
export function rankReplies<T extends { nickname: string; score: number; label: string }>(
  replies: T[],
): (T & { rank: number })[] {
  const sorted = [...replies].sort((a, b) => b.score - a.score);
  const scores = sorted.map((r) => r.score);
  return sorted.map((r) => ({ ...r, rank: rankOf(scores, r.score) }));
}

/** 공유 링크에 붙는 캠페인 파라미터 — 유입→입력→재생성 K값 측정용 */
export const CHEMI_UTM = "utm_source=share&utm_campaign=chemi_invite";

export const CHEMI_CODE_LEN = 8;
export const CHEMI_OWNER_KEY_LEN = 32;
export const CHEMI_NICKNAME_MAX = 12;

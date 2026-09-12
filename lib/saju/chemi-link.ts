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

/** 순위판 한 줄 — isPrivate는 주인 응답에만 실린다(친구 응답은 비공개 행 자체를 뺀다) */
export interface ChemiRankRow {
  nickname: string;
  score: number;
  label: string;
  rank: number;
  isPrivate?: boolean;
}

/** 점수 내림차순(동점은 먼저 온 순) + 순위 부여 */
export function rankReplies<T extends { nickname: string; score: number; label: string }>(
  replies: T[],
): (T & { rank: number })[] {
  const sorted = [...replies].sort((a, b) => b.score - a.score);
  const scores = sorted.map((r) => r.score);
  return sorted.map((r) => ({ ...r, rank: rankOf(scores, r.score) }));
}

/** 친구(비주인)에게 보여주는 순위 수 — 전체는 링크 주인만 */
export const CHEMI_PUBLIC_TOP = 5;

/**
 * 친구(비주인)가 받는 순위판 형태 (스펙 2026-09-12 비공개 옵션)
 *   locked: 주인이 "나만 보기"로 잠금 — 인원만 알려준다 (자기 결과·초대는 그대로)
 *   공개: 비공개 응답을 뺀 상위 N + 비공개 인원(privateCount). total은 비공개 포함 전체.
 */
export type ChemiBoardView =
  | { locked: true; total: number }
  | { locked: false; replies: ChemiRankRow[]; total: number; privateCount: number };

/**
 * 전체 순위(rankReplies 결과, 비공개 포함)에서 친구용 순위판을 만든다.
 * 순위(rank)는 비공개 응답을 포함한 전체 기준 그대로 둔다 — 비공개 1위가 있으면 공개 첫 줄은 2위로 보인다.
 */
export function publicBoardView(
  ranking: ChemiRankRow[],
  boardPublic: boolean,
  top: number = CHEMI_PUBLIC_TOP,
): ChemiBoardView {
  const total = ranking.length;
  if (!boardPublic) return { locked: true, total };
  const privateCount = ranking.filter((r) => r.isPrivate === true).length;
  const replies = ranking
    .filter((r) => r.isPrivate !== true)
    .slice(0, top)
    .map(({ nickname, score, label, rank }) => ({ nickname, score, label, rank }));
  return { locked: false, replies, total, privateCount };
}

/** 공유 링크에 붙는 캠페인 파라미터 — 유입→입력→재생성 K값 측정용 */
export const CHEMI_UTM = "utm_source=share&utm_campaign=chemi_invite";

export const CHEMI_CODE_LEN = 8;
export const CHEMI_OWNER_KEY_LEN = 32;
export const CHEMI_NICKNAME_MAX = 12;

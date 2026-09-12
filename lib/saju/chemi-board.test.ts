import { describe, expect, it } from "vitest";
import { CHEMI_PUBLIC_TOP, publicBoardView, rankReplies, type ChemiRankRow } from "./chemi-link";

// 비공개 옵션(스펙 2026-09-12) — 친구용 순위판을 만드는 순수 함수 검증
function ranking(rows: { n: string; s: number; p?: boolean }[]): ChemiRankRow[] {
  return rankReplies(rows.map((r) => ({ nickname: r.n, score: r.s, label: "", isPrivate: r.p === true })));
}

describe("publicBoardView — 친구 비공개 응답", () => {
  it("비공개 행은 목록에서 빠지고 privateCount·total에만 반영된다", () => {
    const view = publicBoardView(ranking([{ n: "a", s: 90 }, { n: "b", s: 85, p: true }, { n: "c", s: 70 }]), true);
    expect(view.locked).toBe(false);
    if (view.locked) return;
    expect(view.replies.map((r) => r.nickname)).toEqual(["a", "c"]);
    expect(view.privateCount).toBe(1);
    expect(view.total).toBe(3);
  });

  it("순위는 비공개 포함 전체 기준 — 비공개 1위가 있으면 공개 첫 줄은 2위", () => {
    const view = publicBoardView(ranking([{ n: "secret", s: 95, p: true }, { n: "a", s: 90 }, { n: "b", s: 80 }]), true);
    if (view.locked) throw new Error("locked이면 안 됨");
    expect(view.replies.map((r) => `${r.nickname}${r.rank}`)).toEqual(["a2", "b3"]);
  });

  it("친구 응답 행에는 isPrivate 필드가 실리지 않는다 (nickname·score·label·rank만)", () => {
    const view = publicBoardView(ranking([{ n: "a", s: 90 }]), true);
    if (view.locked) throw new Error("locked이면 안 됨");
    expect(Object.keys(view.replies[0]).sort()).toEqual(["label", "nickname", "rank", "score"]);
  });

  it("비공개를 뺀 뒤 상위 N만 자른다 — 비공개가 자리를 차지하지 않는다", () => {
    const rows = ranking([
      { n: "p1", s: 96, p: true },
      { n: "p2", s: 94, p: true },
      ...Array.from({ length: 7 }, (_, i) => ({ n: `u${i}`, s: 90 - i })),
    ]);
    const view = publicBoardView(rows, true);
    if (view.locked) throw new Error("locked이면 안 됨");
    expect(view.replies).toHaveLength(CHEMI_PUBLIC_TOP);
    expect(view.replies.every((r) => r.nickname.startsWith("u"))).toBe(true);
    expect(view.replies[0].rank).toBe(3); // 비공개 두 명이 위에 있으므로
    expect(view.privateCount).toBe(2);
    expect(view.total).toBe(9);
  });
});

describe("publicBoardView — 주인 잠금", () => {
  it("boardPublic=false면 {locked:true,total}만 준다 — 이름·점수는 실리지 않는다", () => {
    const view = publicBoardView(ranking([{ n: "민지", s: 90 }, { n: "수아", s: 80, p: true }]), false);
    expect(view).toEqual({ locked: true, total: 2 });
    const json = JSON.stringify(view);
    expect(json).not.toContain("민지");
    expect(json).not.toContain("90");
  });

  it("응답이 없어도 잠금 형태는 같다", () => {
    expect(publicBoardView([], false)).toEqual({ locked: true, total: 0 });
    expect(publicBoardView([], true)).toEqual({ locked: false, replies: [], total: 0, privateCount: 0 });
  });
});

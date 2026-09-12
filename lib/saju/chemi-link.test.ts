import { describe, expect, it } from "vitest";
import { chemiLabel, rankOf, rankReplies } from "./chemi-link";
import { computeChemistry, computeChemistryFromSubsets, toChemiSubset } from "./chemistry";
import { computeAll } from "./compute";

const A = computeAll({ year: 1996, month: 11, day: 23, hourValue: "14", isLunar: false, isLeap: false });
const B = computeAll({ year: 1994, month: 4, day: 2, hourValue: "unknown", isLunar: false, isLeap: false });

describe("chemiLabel", () => {
  it("58~96 전 구간에서 비어 있지 않은 라벨을 준다", () => {
    for (let s = 58; s <= 96; s++) expect(chemiLabel(s).length).toBeGreaterThan(0);
  });
  it("부정 어휘가 없다 (전원 긍정 라벨 원칙)", () => {
    const banned = /안\s*맞|나쁨|최악|별로|위험|충돌|피하/;
    for (let s = 58; s <= 96; s++) expect(chemiLabel(s)).not.toMatch(banned);
  });
  it("높은 점수일수록 같거나 더 강한 구간 라벨 — 구간 경계가 단조", () => {
    expect(chemiLabel(96)).toBe(chemiLabel(90));
    expect(chemiLabel(89)).toBe(chemiLabel(82));
    expect(chemiLabel(58)).toBe(chemiLabel(65));
    expect(chemiLabel(96)).not.toBe(chemiLabel(58));
  });
});

describe("rankOf / rankReplies", () => {
  it("동점은 같은 등수, 다음 등수는 건너뛴다 (1224식)", () => {
    expect(rankOf([90, 80, 80, 70], 80)).toBe(2);
    expect(rankOf([90, 80, 80, 70], 70)).toBe(4);
    expect(rankOf([], 60)).toBe(1);
  });
  it("점수 내림차순으로 정렬하고 순위를 붙인다", () => {
    const rows = rankReplies([
      { nickname: "a", score: 70, label: "" },
      { nickname: "b", score: 90, label: "" },
      { nickname: "c", score: 90, label: "" },
    ]);
    expect(rows.map((r) => `${r.nickname}${r.rank}`)).toEqual(["b1", "c1", "a3"]);
  });
});

describe("ChemiSubset", () => {
  it("서브셋만으로 계산해도 원본 SajuResult 계산과 같은 점수", () => {
    const viaSubset = computeChemistryFromSubsets(toChemiSubset(A), toChemiSubset(B));
    expect(viaSubset).toEqual(computeChemistry(A, B));
  });
  it("서브셋에는 생년월일·간지 원본이 없다 — 지지와 오행 분포만", () => {
    const s = toChemiSubset(A);
    expect(Object.keys(s).sort()).toEqual(["branches", "elements"]);
    expect(s.branches).toHaveLength(4);
    expect(s.elements).toHaveLength(5);
  });
});

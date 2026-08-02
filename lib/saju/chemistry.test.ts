import { describe, expect, it } from "vitest";
import { computeChemistry } from "./chemistry";
import { computeAll } from "./compute";

const A = computeAll({ year: 1996, month: 11, day: 23, hourValue: "14", isLunar: false, isLeap: false });
const B = computeAll({ year: 1994, month: 4, day: 2, hourValue: "unknown", isLunar: false, isLeap: false });

describe("computeChemistry", () => {
  it("점수는 58~96 범위", () => {
    const c = computeChemistry(A, B);
    expect(c.score).toBeGreaterThanOrEqual(58);
    expect(c.score).toBeLessThanOrEqual(96);
  });
  it("대칭성 — 순서를 바꿔도 동일", () => {
    expect(computeChemistry(A, B)).toEqual(computeChemistry(B, A));
  });
  it("결정론 — 같은 입력이면 항상 같은 점수", () => {
    expect(computeChemistry(A, B).score).toBe(computeChemistry(A, B).score);
  });
});

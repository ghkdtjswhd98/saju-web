import { describe, expect, it } from "vitest";
import { bandOf, scoreMonthBranch, yearlyFlow } from "./flow-score";
import { computeAll } from "./compute";

describe("월별 흐름 지수 (결정론)", () => {
  it("충이 들어오는 달은 기본선보다 낮고, 합이 들어오는 달은 높다", () => {
    // 자(쥐) 지지 보유자: 오(말)월 = 자오충, 축(소)월 = 자축합
    const own = ["자", "인", "진"];
    const chung = scoreMonthBranch(own, "오");
    const hap = scoreMonthBranch(own, "축");
    const neutral = scoreMonthBranch(own, "사"); // 사와 자·인·진: 인사형만? — 최소한 합·충 없음 확인용
    expect(chung).toBeLessThan(50);
    expect(hap).toBeGreaterThan(50);
    expect(hap).toBeGreaterThan(chung);
    expect(neutral).toBeGreaterThanOrEqual(10);
  });

  it("점수는 항상 10~95 범위", () => {
    const branches = "자축인묘진사오미신유술해".split("");
    for (const b of branches) {
      const s = scoreMonthBranch(["오", "오", "오", "오"], b);
      expect(s).toBeGreaterThanOrEqual(10);
      expect(s).toBeLessThanOrEqual(95);
    }
  });

  it("같은 입력이면 언제나 같은 곡선 (결정론)", () => {
    const saju = computeAll({
      gender: "여", year: 1996, month: 11, day: 23,
      hourValue: "14", isLunar: false, isLeap: false,
    });
    const a = yearlyFlow(saju, 2026);
    const b = yearlyFlow(saju, 2026);
    expect(a).toEqual(b);
    expect(a).toHaveLength(12);
    for (const m of a) expect(m.band).toBe(bandOf(m.score));
  });
});

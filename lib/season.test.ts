import { describe, expect, it } from "vitest";
import { CHUSEOK_2026, currentSeason } from "./season";

// KST 시각을 UTC Date로 — 시즌 경계는 한국 자정 기준이어야 한다
const kst = (s: string) => new Date(`${s}+09:00`);

describe("currentSeason — 명절 시즌 문구 레이어", () => {
  it("시즌 밖에서는 null (평상시 문구 그대로)", () => {
    expect(currentSeason(kst("2026-09-16T23:59:59"))).toBeNull();
    expect(currentSeason(kst("2026-09-29T00:00:00"))).toBeNull();
    expect(currentSeason(kst("2026-07-01T12:00:00"))).toBeNull();
  });

  it("추석 기간에는 추석 문구가 켜진다 — 시작/끝 모두 한국 자정 경계", () => {
    expect(currentSeason(kst("2026-09-17T00:00:00"))?.key).toBe("chuseok");
    expect(currentSeason(kst("2026-09-25T13:00:00"))?.key).toBe("chuseok"); // 추석 당일
    expect(currentSeason(kst("2026-09-28T23:59:59"))?.key).toBe("chuseok");
  });

  it("기간이 지나면 저절로 꺼진다 — 손으로 되돌릴 필요가 없다", () => {
    expect(CHUSEOK_2026.end.getTime()).toBeGreaterThan(CHUSEOK_2026.start.getTime());
    expect(currentSeason(new Date(CHUSEOK_2026.end.getTime() + 1000))).toBeNull();
  });

  it("문구에 서열 비하 표현이 없다 — 꼴찌도 웃고 넘길 수 있어야 한다", () => {
    const s = currentSeason(kst("2026-09-25T12:00:00"))!;
    const all = [s.badge, s.homeTitle.join(" "), s.homeSub, s.stepShareDesc, s.ownerShareHint,
      s.friendKicker, s.metaTitle, s.metaDescription].join(" ");
    for (const banned of ["안 맞", "최악", "꼴찌", "상극", "불화", "원수"]) {
      expect(all, `금지 표현: ${banned}`).not.toContain(banned);
    }
  });

  it("모든 문구가 비어있지 않다 (화면에 빈칸이 뜨지 않게)", () => {
    const s = currentSeason(kst("2026-09-25T12:00:00"))!;
    expect(s.homeTitle).toHaveLength(2);
    for (const v of [s.badge, ...s.homeTitle, s.homeSub, s.stepShareDesc, s.ownerShareHint,
      s.friendKicker, s.metaTitle, s.metaDescription]) {
      expect(v.trim().length).toBeGreaterThan(0);
    }
  });
});

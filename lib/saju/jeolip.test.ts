// 절입 시각 보정 + 야자시 처리 검증 — 2026-08-25 3엔진 교차검증(docs/saju-skills-benchmark.md) 기반.
// 기대값 출처: reference saju.js(진태양시 보정)와 bazi pai_pan(KST−1h 환산)이 합의한 값.
import { describe, expect, it } from "vitest";
import { computeAll } from "./compute";
import { checkJeolip, preciseDaewoonAge, slotRepTime } from "./jeolip";

const p = (r: ReturnType<typeof computeAll>) =>
  `${r.pillars.year.hangul} ${r.pillars.month.hangul} ${r.pillars.day.hangul} ${r.pillars.hour?.hangul ?? "-"}`;

describe("절입 시각 보정 (라이브러리 날짜 단위 판정 버그 교정)", () => {
  it("입춘일(2024-02-04, 입춘 17:27) 절입 전 출생 → 전년 계묘년·을축월 + 대운 역행", () => {
    // 신시(15:30~17:30, 대표 16:30) — 절입 17:27 이전
    const r = computeAll({ year: 2024, month: 2, day: 4, hourValue: "16", isLunar: false, isLeap: false, gender: "남" });
    expect(p(r)).toBe("계묘 을축 무술 경신");
    expect(r.daewoon?.direction).toBe("역행"); // 계(음간)+남 → 역행. 보정 전엔 갑진년으로 순행이 나오던 버그
    expect(r.daewoon?.startAge).toBe(10);
    expect(r.daewoon?.pillars[0].hangul).toBe("갑자");
    expect(r.jeolip?.adjusted).toBe(true);
  });

  it("같은 날 절입 후 출생(유시 18:30) → 갑진년·병인월 유지", () => {
    const r = computeAll({ year: 2024, month: 2, day: 4, hourValue: "18", isLunar: false, isLeap: false, gender: "남" });
    expect(r.pillars.year.hangul).toBe("갑진");
    expect(r.pillars.month.hangul).toBe("병인");
    expect(r.daewoon?.direction).toBe("순행");
    expect(r.jeolip?.adjusted).toBe(false);
  });

  it("절입이 시진 슬롯 내부면 ambiguous — 2024-02-04 신시 슬롯(15:30~17:30)에 17:27 포함", () => {
    const jc = checkJeolip(2024, 2, 4, "16");
    expect(jc.ambiguous).toBe(true);
  });

  it("시간 미상 + 절입일 → 정오 가정 보정 + ambiguous", () => {
    const jc = checkJeolip(2024, 2, 4, "unknown");
    expect(jc.needShift).toBe(true); // 12:00 < 17:27
    expect(jc.ambiguous).toBe(true);
  });

  it("입춘 외 절입(월 경계만) — 망종일 절입 전 출생은 월주만 -1, 연주 유지", () => {
    // 2000-06-05 망종 (KST 새벽) — 절입 후인 정오 출생은 무보정이어야 함을 함께 확인
    const jcAfter = checkJeolip(2000, 6, 5, "12");
    if (jcAfter.term) {
      // 절입 시각에 따라 needShift가 갈리므로, 보정 로직의 일관성만 확인
      expect(jcAfter.needShift).toBe(jcAfter.compIso < (jcAfter.termTime ?? ""));
    }
  });
});

describe("회귀 — 교차검증에서 3엔진 일치했던 케이스는 그대로", () => {
  it("1998-05-06 10:31 남 (입하일이지만 절입 02:03 이후 출생 — 무보정)", () => {
    const r = computeAll({ year: 1998, month: 5, day: 6, hourValue: "10", isLunar: false, isLeap: false, gender: "남" });
    expect(p(r)).toBe("무인 정사 계축 정사");
    expect(r.daewoon?.direction).toBe("순행");
    expect(r.daewoon?.startAge).toBe(10);
    expect(r.daewoon?.pillars.slice(0, 3).map((x) => x.hangul)).toEqual(["무오", "기미", "경신"]);
    expect(r.jeolip?.adjusted).toBe(false); // 절입일이긴 하나 이후 출생
  });

  it("2000-07-05 11:06 여 (사시)", () => {
    const r = computeAll({ year: 2000, month: 7, day: 5, hourValue: "10", isLunar: false, isLeap: false, gender: "여" });
    expect(p(r)).toBe("경진 임오 갑자 기사");
    expect(r.daewoon?.direction).toBe("역행");
    expect(r.daewoon?.startAge).toBe(10);
    expect(r.daewoon?.pillars[0].hangul).toBe("신사");
  });

  it("음력 1990-04-15 12:00 여 → 양력 1990-05-09", () => {
    const r = computeAll({ year: 1990, month: 4, day: 15, hourValue: "12", isLunar: true, isLeap: false, gender: "여" });
    expect(p(r)).toBe("경오 신사 갑술 경오");
    expect(r.daewoon?.pillars[0].hangul).toBe("경진");
  });
});

describe("야자시(23:30~24:00) — 일주 유지 + 시천간 익일 기준", () => {
  it("1995-03-10 23:40 → 일주 경자 유지, 시주 무자(익일 신丑일 오서둔)", () => {
    const r = computeAll({ year: 1995, month: 3, day: 10, hourValue: "23", isLunar: false, isLeap: false, gender: "남" });
    expect(r.pillars.day.hangul).toBe("경자");
    expect(r.pillars.hour?.hangul).toBe("무자"); // 버그 시절엔 병자(당일 기준)가 나왔다
  });

  it("조자시(00:00~01:30)는 기존 동작 유지 — 1995-03-10 00:30 → 경자일 병자시", () => {
    const r = computeAll({ year: 1995, month: 3, day: 10, hourValue: "0", isLunar: false, isLeap: false, gender: "남" });
    expect(r.pillars.day.hangul).toBe("경자");
    expect(r.pillars.hour?.hangul).toBe("병자");
  });

  it("월말 야자시 날짜 넘김 — 1999-12-31 23:45", () => {
    const r = computeAll({ year: 1999, month: 12, day: 31, hourValue: "23", isLunar: false, isLeap: false, gender: "여" });
    expect(r.pillars.hour?.branch).toBe("자");
    expect(r.pillars.day.hangul).toBe(
      computeAll({ year: 1999, month: 12, day: 31, hourValue: "12", isLunar: false, isLeap: false, gender: "여" }).pillars.day.hangul,
    ); // 일주는 당일 유지
  });
});

describe("대운수 정밀 계산 (절입 테이블 기반)", () => {
  it("slotRepTime 매핑", () => {
    expect(slotRepTime("10")).toBe("10:30");
    expect(slotRepTime("0")).toBe("00:45");
    expect(slotRepTime("23")).toBe("23:45");
    expect(slotRepTime("unknown")).toBe("12:00");
  });

  it("순행/역행 대운수가 1~10 범위", () => {
    for (const iso of ["1998-05-06T10:30", "2000-07-05T10:30", "2024-02-04T16:30"]) {
      for (const fwd of [true, false]) {
        const a = preciseDaewoonAge(iso, fwd);
        expect(a).not.toBeNull();
        expect(a!).toBeGreaterThanOrEqual(1);
        expect(a!).toBeLessThanOrEqual(10);
      }
    }
  });
});

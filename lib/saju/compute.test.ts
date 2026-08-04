import { describe, expect, it } from "vitest";
import {
  computeAll, computeDaewoon, computeOhaengDistribution, computeRatings, computeSipsinWeights,
  deriveSipsin, detectJijiRelations, get12Unseong, getGongmang, getNaeum,
} from "./compute";
import { BRANCHES_ORDER, STEMS_ORDER } from "./constants";
import type { Pillars } from "./types";

// 십신 유도 — 명리학 정의로 수기 검증한 케이스
describe("deriveSipsin", () => {
  it("갑(양목) 일간 기준", () => {
    expect(deriveSipsin("갑", "갑", true)).toBe("비견"); // 같은 오행, 같은 음양
    expect(deriveSipsin("갑", "을", true)).toBe("겁재"); // 같은 오행, 다른 음양
    expect(deriveSipsin("갑", "병", true)).toBe("식신"); // 목생화, 같은 양
    expect(deriveSipsin("갑", "정", true)).toBe("상관"); // 목생화, 다른 음양
    expect(deriveSipsin("갑", "무", true)).toBe("편재"); // 목극토, 같은 양
    expect(deriveSipsin("갑", "기", true)).toBe("정재");
    expect(deriveSipsin("갑", "경", true)).toBe("편관"); // 금극목, 같은 양
    expect(deriveSipsin("갑", "신", true)).toBe("정관");
    expect(deriveSipsin("갑", "임", true)).toBe("편인"); // 수생목, 같은 양
    expect(deriveSipsin("갑", "계", true)).toBe("정인");
  });
  it("지지 대상 (본기 기준 오행/음양)", () => {
    expect(deriveSipsin("갑", "인", false)).toBe("비견"); // 인 = 양목
    expect(deriveSipsin("갑", "자", false)).toBe("편인"); // 자 = 양수
  });
});

describe("computeOhaengDistribution", () => {
  it("천간 1.0 + 지장간 가중치 합산", () => {
    // 천간 [갑] = 목 1.0 / 지지 [자] = 계1.0(수) + 임0.2(수)
    const dist = computeOhaengDistribution(["갑"], ["자"]);
    const byName = Object.fromEntries(dist.map((d) => [d.name, d.count]));
    expect(byName["목"]).toBe(1.0);
    expect(byName["수"]).toBe(1.2);
    expect(byName["화"]).toBe(0);
  });
});

describe("detectJijiRelations", () => {
  it("충/합/삼합/반합/자형 검출", () => {
    expect(detectJijiRelations(["자", "오"]).충).toContain("자오충");
    expect(detectJijiRelations(["자", "축"]).합).toContain("자축합");
    expect(detectJijiRelations(["신", "자", "진"]).삼합).toContain("신자진삼합(수)");
    // 삼합이 완성되면 그 안의 반합은 흡수
    expect(detectJijiRelations(["신", "자", "진"]).반합).toHaveLength(0);
    expect(detectJijiRelations(["신", "자"]).반합).toContain("신자반합");
    expect(detectJijiRelations(["오", "오"]).형).toContain("오오자형");
  });
});

describe("전문 데이터", () => {
  it("12운성 — 갑 일간(장생지 해, 양간 순행)", () => {
    expect(get12Unseong("갑", "해")).toBe("장생");
    expect(get12Unseong("갑", "자")).toBe("목욕");
    expect(get12Unseong("갑", "인")).toBe("건록");
    expect(get12Unseong("갑", "묘")).toBe("제왕");
  });
  it("납음 / 공망", () => {
    expect(getNaeum("갑", "자")).toBe("해중금");
    expect(getGongmang("갑", "자")).toEqual(["술", "해"]); // 갑자순 공망
  });
});

describe("computeRatings", () => {
  it("별점 공식과 구간 변환", () => {
    const w = {
      비견: 0, 겁재: 0, 식신: 2.0, 상관: 1.0, 편재: 0,
      정재: 0, 편관: 0, 정관: 0, 편인: 0, 정인: 0,
    };
    const r = computeRatings(w, []);
    // 매력도 = 2.0*0.6 + 1.0*0.4 = 1.6 → 3점
    expect(r.raw.매력도).toBeCloseTo(1.6);
    expect(r.starsNum.매력도).toBe(3);
    expect(r.stars.매력도).toBe("⭐⭐⭐☆☆");
    // 재물운 = 0 → 1점
    expect(r.starsNum.재물운).toBe(1);
  });
});

describe("computeAll (만세력 통합)", () => {
  it("1990-03-15 06:00(묘시) 남 — 팔자 구조 및 파생값 정합성", () => {
    const r = computeAll({
      year: 1990, month: 3, day: 15, hourValue: "6", isLunar: false, isLeap: false,
    });
    // 1990년 = 경오년 (말띠)
    expect(r.pillars.year.hangul).toBe("경오");
    expect(r.hasHour).toBe(true);
    expect(r.pillars.hour).not.toBeNull();
    // 일간 파생값이 상수 테이블과 일치
    expect(r.dayMaster.char).toBe(r.pillars.day.stem);
    // 십신 7개 (시간 포함)
    expect(r.sipsin).toHaveLength(7);
    // 오행 분포: 천간4 + 지장간 합 — 총합은 4 + (지지별 1.2~1.5)*4 범위
    const total = r.elementDist.reduce((s, e) => s + e.count, 0);
    expect(total).toBeGreaterThan(8);
    expect(total).toBeLessThan(11);
    // 별점 5종 모두 1~5
    for (const n of Object.values(r.ratings.starsNum)) {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(5);
    }
    // 전문 데이터 4행 (시→일→월→년)
    expect(r.expert.map((e) => e.pos)).toEqual(["hour", "day", "month", "year"]);
  });

  it("시간 모름 — 시주 null, 십신 5개, 시주 행은 미상", () => {
    const r = computeAll({
      year: 1995, month: 7, day: 20, hourValue: "unknown", isLunar: false, isLeap: false,
    });
    expect(r.hasHour).toBe(false);
    expect(r.pillars.hour).toBeNull();
    expect(r.sipsin).toHaveLength(5);
    expect(r.expert[0].hangul).toBe("미상");
  });

  it("음력 입력 — 음→양 변환 후 계산", () => {
    // 음력 1990-02-19 = 양력 1990-03-15
    const solar = computeAll({
      year: 1990, month: 3, day: 15, hourValue: "unknown", isLunar: false, isLeap: false,
    });
    const lunar = computeAll({
      year: 1990, month: 2, day: 19, hourValue: "unknown", isLunar: true, isLeap: false,
    });
    expect(lunar.pillars.day.hangul).toBe(solar.pillars.day.hangul);
  });
});

describe("computeDaewoon (대운)", () => {
  const next = (hangul: string) => {
    const s = STEMS_ORDER.indexOf(hangul[0]);
    const b = BRANCHES_ORDER.indexOf(hangul[1]);
    return `${STEMS_ORDER[(s + 1) % 10]}${BRANCHES_ORDER[(b + 1) % 12]}`;
  };
  const prev = (hangul: string) => {
    const s = STEMS_ORDER.indexOf(hangul[0]);
    const b = BRANCHES_ORDER.indexOf(hangul[1]);
    return `${STEMS_ORDER[(s + 9) % 10]}${BRANCHES_ORDER[(b + 11) % 12]}`;
  };

  it("방향 규칙 — 양간년(2000 경진): 남=순행, 여=역행", () => {
    const base = { year: 2000, month: 6, day: 15, hourValue: "unknown", isLunar: false, isLeap: false } as const;
    const man = computeAll({ ...base, gender: "남" });
    const woman = computeAll({ ...base, gender: "여" });
    expect(man.pillars.year.stem).toBe("경"); // 양간 전제 확인
    expect(man.daewoon?.direction).toBe("순행");
    expect(woman.daewoon?.direction).toBe("역행");
    // 첫 대운 간지는 월주의 다음/이전 간지
    expect(man.daewoon?.pillars[0].hangul).toBe(next(man.pillars.month.hangul));
    expect(woman.daewoon?.pillars[0].hangul).toBe(prev(woman.pillars.month.hangul));
  });

  it("방향 규칙 — 음간년(2001 신사): 남=역행, 여=순행", () => {
    const base = { year: 2001, month: 6, day: 15, hourValue: "unknown", isLunar: false, isLeap: false } as const;
    const man = computeAll({ ...base, gender: "남" });
    expect(man.pillars.year.stem).toBe("신"); // 음간 전제 확인
    expect(man.daewoon?.direction).toBe("역행");
    expect(computeAll({ ...base, gender: "여" }).daewoon?.direction).toBe("순행");
  });

  it("대운수 — 절입 직후 출생이면 역행 대운수는 1, 순행은 큼", () => {
    // 2000-02-05 = 입춘(2/4) 바로 다음날. 여자(역행)는 직전 절입까지 1일 → 대운수 1.
    // 남자(순행)는 다음 절입(경칩, 약 한 달 뒤)까지 ~29일 → 대운수 9~10.
    const base = { year: 2000, month: 2, day: 5, hourValue: "unknown", isLunar: false, isLeap: false } as const;
    const woman = computeAll({ ...base, gender: "여" });
    const man = computeAll({ ...base, gender: "남" });
    expect(woman.daewoon?.startAge).toBe(1);
    expect(man.daewoon?.startAge).toBeGreaterThanOrEqual(9);
    expect(man.daewoon?.startAge).toBeLessThanOrEqual(10);
  });

  it("대운 구간 — 8개, 10년 간격, 60갑자 연속", () => {
    const r = computeAll({
      year: 1994, month: 7, day: 22, hourValue: "unknown", isLunar: false, isLeap: false, gender: "여",
    });
    const dw = r.daewoon!;
    expect(dw.pillars).toHaveLength(8);
    for (let i = 0; i < 8; i++) {
      expect(dw.pillars[i].startAge).toBe(dw.startAge + i * 10);
      expect(dw.pillars[i].endAge).toBe(dw.startAge + i * 10 + 9);
      if (i > 0) {
        const expected = dw.direction === "순행" ? next(dw.pillars[i - 1].hangul) : prev(dw.pillars[i - 1].hangul);
        expect(dw.pillars[i].hangul).toBe(expected);
      }
    }
  });

  it("성별 없으면 daewoon 미계산", () => {
    const r = computeAll({
      year: 1994, month: 7, day: 22, hourValue: "unknown", isLunar: false, isLeap: false,
    });
    expect(r.daewoon).toBeUndefined();
  });
});

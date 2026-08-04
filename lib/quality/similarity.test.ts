import { describe, expect, it } from "vitest";
import { normalizeForCompare, pairwiseSimilarity, similarity } from "./similarity";

describe("normalizeForCompare", () => {
  it("이름과 숫자를 지운다 — 이 둘이 남으면 진짜 문제(문장 재사용)가 가려진다", () => {
    const out = normalizeForCompare("지민님은 28세부터 37세까지 단단해져요.");
    expect(out).not.toContain("28");
    expect(out).not.toContain("지민");
  });

  it("공백과 문장부호를 정규화한다", () => {
    expect(normalizeForCompare("가나  다라,  마바!")).toBe("가나다라마바");
  });
});

describe("similarity", () => {
  it("동일 텍스트는 1.0", () => {
    const t = "물의 기운이 짙어 흐름을 읽는 감각이 살아 있어요.";
    expect(similarity(t, t)).toBe(1);
  });

  it("완전히 다른 텍스트는 낮다", () => {
    const a = "물의 기운이 짙어 흐름을 읽는 감각이 살아 있어요.";
    const b = "굳세게 밀어붙이는 추진력이 남다른 사람이에요.";
    expect(similarity(a, b)).toBeLessThan(0.2);
  });

  it("이름만 바뀐 같은 템플릿은 매우 높다 — 이게 이 도구의 존재 이유", () => {
    const a = "지민님은 흙의 기운이 두터워 쉽게 흔들리지 않는 사람이에요. 주변에서 먼저 기대러 와요.";
    const b = "서연님은 흙의 기운이 두터워 쉽게 흔들리지 않는 사람이에요. 주변에서 먼저 기대러 와요.";
    expect(similarity(a, b)).toBeGreaterThan(0.9);
  });

  it("빈 문자열은 0으로 안전하게 처리한다", () => {
    expect(similarity("", "무언가")).toBe(0);
    expect(similarity("", "")).toBe(0);
  });
});

describe("pairwiseSimilarity", () => {
  it("모든 쌍을 점수 내림차순으로 반환한다", () => {
    const pairs = pairwiseSimilarity([
      { id: "a", text: "흙의 기운이 두터워 흔들리지 않아요." },
      { id: "b", text: "흙의 기운이 두터워 흔들리지 않아요." },
      { id: "c", text: "불꽃처럼 타오르는 표현력이 강점이에요." },
    ]);
    expect(pairs).toHaveLength(3); // 3C2
    expect(pairs[0].score).toBeGreaterThan(pairs[2].score);
    expect(new Set([pairs[0].a, pairs[0].b])).toEqual(new Set(["a", "b"]));
  });

  it("1건 이하면 빈 배열", () => {
    expect(pairwiseSimilarity([{ id: "a", text: "하나뿐" }])).toEqual([]);
  });
});

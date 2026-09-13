import { describe, expect, it } from "vitest";
import { PRODUCTS, getProduct } from "./products";

describe("상품 카탈로그", () => {
  it("모든 상품에 분량 메타가 있다", () => {
    for (const p of Object.values(PRODUCTS)) {
      expect(p.pdfPages).toBeGreaterThan(0);
      expect(p.charCount).toMatch(/자$/);
    }
  });

  it("deep은 가격 사다리 상단이다 (lifetime보다 비싸고 섹션이 많다)", () => {
    const deep = getProduct("deep")!;
    const lifetime = getProduct("lifetime")!;
    expect(deep.openPrice).toBeGreaterThan(lifetime.openPrice);
    expect(deep.sections.length).toBeGreaterThan(lifetime.sections.length);
    expect(deep.pdfPages).toBeGreaterThan(lifetime.pdfPages);
  });

  it("번들은 포함 상품이 전부 실재한다", () => {
    for (const code of PRODUCTS.bundle.bundleCodes ?? []) {
      expect(getProduct(code)).not.toBeNull();
    }
  });
});

describe("상품 상세 v2 카피", () => {
  it("히어로 질문은 2줄, 감성 문장은 2개다", () => {
    for (const p of Object.values(PRODUCTS)) {
      expect(p.heroQuestion.split("\n")).toHaveLength(2);
      expect(p.moments).toHaveLength(2);
    }
  });

  // 히어로는 30px 굵은 글씨 — 375px 화면(내부 335px ≈ 11em)에서 한 줄이 넘치면 3줄로 깨진다.
  // 한글 1em, 숫자·영문 0.6em, 공백·문장부호 0.3em으로 어림해 줄당 11em 이하만 허용한다.
  it("히어로 질문은 줄마다 375px 화면 한 줄에 들어간다", () => {
    const em = (line: string) =>
      [...line].reduce((w, ch) => w + (/[가-힣]/.test(ch) ? 1 : /[0-9A-Za-z]/.test(ch) ? 0.6 : 0.3), 0);
    for (const p of Object.values(PRODUCTS)) {
      for (const line of p.heroQuestion.split("\n")) {
        expect(em(line), `${p.code}: "${line}"`).toBeLessThanOrEqual(11);
      }
    }
  });

  it("챕터는 목차와 1:1이고 질문은 2~3개다", () => {
    for (const p of Object.values(PRODUCTS)) {
      expect(p.chapters.map((c) => c.title)).toEqual(p.sections);
      for (const c of p.chapters) {
        expect(c.questions.length).toBeGreaterThanOrEqual(2);
        expect(c.questions.length).toBeLessThanOrEqual(3);
      }
    }
  });
});

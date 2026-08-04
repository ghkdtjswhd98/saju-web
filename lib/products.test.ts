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

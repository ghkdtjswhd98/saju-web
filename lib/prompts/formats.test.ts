import { describe, expect, it } from "vitest";
import { FORMATS } from "./formats";
import { PRODUCTS } from "../products";

describe("출력 형식", () => {
  it("모든 상품 코드에 형식이 있다", () => {
    for (const code of Object.keys(PRODUCTS)) {
      if (code === "bundle") continue; // 번들은 하위 상품으로 발급됨
      expect(FORMATS[code], `${code} 형식 누락`).toBeDefined();
    }
  });

  it("deep 형식의 마커 수가 상품 섹션 수와 일치한다", () => {
    expect(FORMATS.deep.markers).toHaveLength(PRODUCTS.deep.sections.length);
  });

  it("deep 형식은 대운 시간표 활용을 지시한다", () => {
    expect(FORMATS.deep.system).toContain("대운_시간표");
  });
});

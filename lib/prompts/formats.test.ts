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

  it("deep은 분할 생성이고, parts의 마커가 순서까지 전체 마커와 일치한다", () => {
    const parts = FORMATS.deep.parts!;
    expect(parts.length).toBeGreaterThan(1);
    const fromParts = parts.flatMap((p) => p.markers.map((m) => m.token));
    expect(fromParts).toEqual(FORMATS.deep.markers.map((m) => m.token));
  });

  it("deep의 대운 섹션을 맡은 파트가 대운 시간표 활용을 지시한다", () => {
    const daewoonPart = FORMATS.deep.parts!.find((p) =>
      p.markers.some((m) => m.token === "SECTION_대운흐름"),
    );
    expect(daewoonPart, "대운 섹션을 맡은 파트가 없음").toBeDefined();
    expect(daewoonPart!.system).toContain("대운_시간표");
  });

  it("각 파트가 자기 마커의 구분자를 전부 프롬프트에 포함한다", () => {
    for (const fmt of Object.values(FORMATS)) {
      if (!fmt.parts) continue;
      for (const part of fmt.parts) {
        for (const m of part.markers) {
          expect(part.system, `${m.token} 구분자 누락`).toContain(`===${m.token}===`);
        }
      }
    }
  });

  it("parts를 쓰는 형식은 각 part의 마커가 서로 겹치지 않는다", () => {
    for (const fmt of Object.values(FORMATS)) {
      if (!fmt.parts) continue;
      const tokens = fmt.parts.flatMap((p) => p.markers.map((m) => m.token));
      expect(new Set(tokens).size, "part 간 마커 중복").toBe(tokens.length);
    }
  });
});

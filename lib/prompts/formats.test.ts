import { describe, expect, it } from "vitest";
import { CONCERN_MARKER, CONCERN_SECTION_SYSTEM, FORMATS } from "./formats";
import { parseBlocks } from "../parse-blocks";
import { PRODUCTS } from "../products";

describe("출력 형식", () => {
  it("모든 상품 코드에 형식이 있다", () => {
    for (const code of Object.keys(PRODUCTS)) {
      if (code === "bundle") continue; // 번들은 하위 상품으로 발급됨
      expect(FORMATS[code], `${code} 형식 누락`).toBeDefined();
    }
  });

  it("모든 유료 상품의 마커 수가 상품 페이지 목차 수와 일치한다", () => {
    for (const p of Object.values(PRODUCTS)) {
      if (p.code === "bundle") continue;
      expect(FORMATS[p.code].markers, `${p.code} 마커/목차 불일치`).toHaveLength(
        p.sections.length,
      );
    }
  });

  it("단일 생성 형식은 자기 마커의 구분자를 전부 프롬프트에 포함한다", () => {
    for (const [code, fmt] of Object.entries(FORMATS)) {
      if (fmt.parts) continue; // 분할 생성은 아래 별도 테스트
      for (const m of fmt.markers) {
        expect(fmt.system, `${code}: ${m.token} 구분자 누락`).toContain(`===${m.token}===`);
      }
    }
  });

  // 2026-08-27 확장 4종 — 콘텐츠 가드레일이 프롬프트에 실제로 실려 있는지
  it("재회 형식에 확률 단정 금지·정직한 축 지시가 있다", () => {
    expect(FORMATS.reunion.system).toContain("퍼센트로 단정하지 마세요");
    expect(FORMATS.reunion.system).toContain("답이 아닐 수도");
  });

  it("결혼 형식이 대운 시간표를 활용하고 확정 예언을 금지한다", () => {
    expect(FORMATS.marriage.system).toContain("대운_시간표");
    expect(FORMATS.marriage.system).toContain("확정 예언 금지");
  });

  it("도화 형식은 판정 즉답을 지시하고 낙인 표현을 금지한다", () => {
    expect(FORMATS.dohwa.system).toContain("미루지 않기");
    expect(FORMATS.dohwa.system).toContain("낙인 표현 금지");
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

// 실제로 터졌던 사고: ANTI_CLICHE가 "겉↔속 대비 구조"를 금지하는데,
// 같은 system에 합쳐지는 base-reference와 섹션 지시문 4곳이 바로 그 구조를 "권장"하고 있었다.
// 모델은 당연히 권장을 따랐고, 결과물이 전부 "겉은 차분한데 속은 열정"으로 수렴했다.
// 프롬프트가 스스로 모순되면 어느 쪽이 이길지는 운이므로, 코드로 막는다.
describe("프롬프트 자기모순 방지", () => {
  // "겉/속을 대비하라"고 지시하는 형태만 잡는다. 금지 문구 자체("쓰지 마세요")는 통과해야 한다.
  const ENCOURAGES_CONTRAST =
    /(겉모습과 속마음|겉과 속)의?\s*(반전|간극|대비)(?![^\n]{0,40}(금지|마세요|안 됩니다|실패))/;

  function allSystems(): { where: string; text: string }[] {
    const out: { where: string; text: string }[] = [];
    for (const [code, fmt] of Object.entries(FORMATS)) {
      out.push({ where: `${code}.system`, text: fmt.system });
      fmt.parts?.forEach((p, i) => out.push({ where: `${code}.parts[${i}]`, text: p.system }));
    }
    return out;
  }

  it("어떤 프롬프트도 겉/속 대비 구조를 권장하지 않는다", () => {
    for (const { where, text } of allSystems()) {
      const hit = text.match(ENCOURAGES_CONTRAST);
      expect(hit?.[0], `${where}에서 금지된 겉/속 대비를 권장함: "${hit?.[0]}"`).toBeUndefined();
    }
  });

  it("유료 프롬프트에 금지 규칙(ANTI_CLICHE)이 실제로 실려 있다", () => {
    for (const { where, text } of allSystems()) {
      expect(text, `${where}에 겉/속 금지 규칙이 없음`).toContain('"겉 ↔ 속" 대비 구조 자체를 금지');
    }
  });

  it("deep 1부가 과거 적중 섹션을 대운 표시 기반으로 지시한다", () => {
    const first = FORMATS.deep.parts![0];
    expect(first.markers[0].token).toBe("SECTION_먼저맞혀볼게요");
    // 모델이 나이를 직접 계산하면 지나온 대운을 미래로 말하는 사고가 난다 —
    // 반드시 user 메시지의 [지나옴] 표시를 근거로 삼게 해야 한다.
    expect(first.system).toContain("[지나옴]");
  });
});

// 고민 접수 시 deep 마지막 파트에 동적으로 붙는 "물어보신 것에 대하여" 섹션.
// 스트림 라우트의 조립 로직과 같은 방식으로 확장했을 때 파싱까지 일관되는지 검증한다.
describe("고민 동적 섹션 (물어보신 것에 대하여)", () => {
  it("동적 시스템이 구분자와 우선 지시를 포함한다", () => {
    expect(CONCERN_SECTION_SYSTEM).toContain(`===${CONCERN_MARKER.token}===`);
    // 마지막 파트의 "실천조언으로 끝납니다" 지시를 이기지 못하면 섹션이 안 나온다
    expect(CONCERN_SECTION_SYSTEM).toContain("이 지시가 우선");
  });

  it("확장 마커로 동적 섹션이 포함된 출력을 깨끗하게 파싱한다", () => {
    const allMarkers = [...FORMATS.deep.markers, CONCERN_MARKER];
    // deep 전체 출력을 시뮬레이션 (각 섹션 최소 내용)
    const rawText = allMarkers
      .map((m) => `===${m.token}===\n${m.key}의 본문입니다.`)
      .join("\n\n");
    const blocks = parseBlocks(rawText, allMarkers);
    expect("raw" in blocks).toBe(false);
    expect((blocks as Record<string, string>)["물어보신 것에 대하여"]).toContain("본문");
  });

  it("확장 없이 기존 마커만으로도 기존 출력이 그대로 파싱된다 (하위 호환)", () => {
    const rawText = FORMATS.deep.markers
      .map((m) => `===${m.token}===\n${m.key}의 본문입니다.`)
      .join("\n\n");
    const blocks = parseBlocks(rawText, FORMATS.deep.markers);
    expect("raw" in blocks).toBe(false);
  });
});

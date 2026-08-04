import { describe, expect, it } from "vitest";
import { findCliches } from "./cliche";

describe("findCliches", () => {
  it("겉/속 대비 클리셰를 잡는다 — 무료 결과 3건이 전부 이걸로 수렴했던 실패 패턴", () => {
    const hits = findCliches("겉은 차분해 보이지만 속은 열정으로 가득한 사람이에요.");
    expect(hits.map((h) => h.rule)).toContain("겉속대비");
  });

  it("전문용어 누출을 잡는다", () => {
    const hits = findCliches("이 사주는 편인이 강하게 자리 잡고 있어요.");
    expect(hits.map((h) => h.rule)).toContain("전문용어");
    expect(hits[0].excerpt).toContain("편인");
  });

  it("콜드리딩은 2회까지 허용하고 3회부터 잡는다", () => {
    const twice = "그런 적 있죠? 이런 적 있죠?";
    expect(findCliches(twice).map((h) => h.rule)).not.toContain("콜드리딩남발");

    const thrice = "그런 적 있죠? 이런 적 있죠? 저런 적 있죠?";
    expect(findCliches(thrice).map((h) => h.rule)).toContain("콜드리딩남발");
  });

  it("진부한 성격 서술(나열형)을 잡는다", () => {
    const hits = findCliches("생각이 많은 편이고 정이 많으며 책임감이 강해요.");
    expect(hits.map((h) => h.rule)).toContain("진부성격서술");
  });

  it("구체적 메커니즘 서술은 오탐하지 않는다 — 같은 어휘라도 진단이면 통과", () => {
    const hits = findCliches(
      "생각이 많아지면서 실행을 미루는 경향이 있어요. 물 기운이 짙어 결정 직전에 한 번 더 재검토하거든요.",
    );
    expect(hits.map((h) => h.rule)).not.toContain("진부성격서술");
  });

  it("겉속대비의 변형 어휘도 잡는다 — 실데이터에서 '화력'으로 우회된 사례", () => {
    const hits = findCliches("겉으로는 차분해 보이지만 속으로는 화력 있어요.");
    expect(hits.map((h) => h.rule)).toContain("겉속대비");
  });

  it("정상적인 개인화 문장은 통과시킨다", () => {
    const clean =
      "물 기운이 3.2로 유난히 짙게 깔린 구조라, 회의에서 아이디어는 제일 먼저 내면서 발표는 슬쩍 미루는 결이 있어요.";
    expect(findCliches(clean)).toEqual([]);
  });
});

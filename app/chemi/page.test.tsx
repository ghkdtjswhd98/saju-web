import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ChemiPage, { generateMetadata } from "./page";

// 서버 컴포넌트를 그냥 함수로 호출해 JSX 트리의 문자열만 모은다.
// (렌더러 없이 확인 — 시즌 분기가 화면까지 연결됐는지가 관심사)
function textOf(node: unknown): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  const el = node as ReactElement<{ children?: unknown }>;
  if (typeof el === "object" && "props" in el) {
    const { children, ...rest } = el.props ?? {};
    // desc/title처럼 props로 넘긴 문자열도 포함해야 3단계 안내가 잡힌다
    const propText = Object.values(rest)
      .filter((v) => typeof v === "string")
      .join(" ");
    return `${propText} ${textOf(children)}`;
  }
  return "";
}

const setNow = (kst: string) => vi.setSystemTime(new Date(`${kst}+09:00`));

afterEach(() => vi.useRealTimers());

describe("/chemi 대문 — 시즌 문구 연결", () => {
  it("추석 기간에는 가족 케미 문구가 화면과 메타데이터에 나온다", () => {
    vi.useFakeTimers();
    setNow("2026-09-25T12:00:00");
    const text = textOf(ChemiPage());
    expect(text).toContain("명절에 모인 가족,");
    expect(text).toContain("가족 단톡방에 링크 올리기");
    expect(text).toContain("추석 한정");
    expect(generateMetadata().title).toContain("추석");
  });

  it("시즌 밖에서는 평상시 문구로 돌아간다 — 지난 명절 문구가 남지 않는다", () => {
    vi.useFakeTimers();
    setNow("2026-10-05T12:00:00");
    const text = textOf(ChemiPage());
    expect(text).toContain("친구 중 누가");
    expect(text).not.toContain("추석");
    expect(text).not.toContain("명절");
    expect(generateMetadata().title).not.toContain("추석");
  });
});

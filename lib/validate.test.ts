import { describe, expect, it } from "vitest";
import { CONCERN_MAX, detectCrisis, parseEmail, parsePersonInput } from "./validate";

describe("parseEmail", () => {
  it("정상 이메일을 소문자로 정규화한다", () => {
    expect(parseEmail("  Hong@Example.COM ")).toBe("hong@example.com");
  });

  it("형식이 아니면 null", () => {
    for (const bad of ["", "hong", "hong@", "@example.com", "hong example.com", "hong@ex", null, 123]) {
      expect(parseEmail(bad), `${String(bad)} 는 거부돼야 함`).toBeNull();
    }
  });

  it("지나치게 긴 입력은 거부한다 (DB 오염 방지)", () => {
    expect(parseEmail("a".repeat(250) + "@example.com")).toBeNull();
  });

  it("한글 도메인 등 비ASCII는 거부한다 (발송 실패 방지)", () => {
    expect(parseEmail("사람@예시.한국")).toBeNull();
  });
});

describe("parsePersonInput", () => {
  it("정상 입력을 통과시킨다", () => {
    const p = parsePersonInput({
      name: "지민", gender: "여", year: 1995, month: 3, day: 15,
      hourValue: "unknown", isLunar: false, isLeap: false,
    });
    expect(p?.name).toBe("지민");
  });

  it("성별·시간이 없으면 거부한다", () => {
    expect(parsePersonInput({ gender: "여", year: 1995, month: 3, day: 15 })).toBeNull();
    expect(parsePersonInput({ year: 1995, month: 3, day: 15, hourValue: "unknown" })).toBeNull();
  });

  it("genderOptional이면 성별 없이 통과하고 gender 키를 만들지 않는다 (케미 최소 수집)", () => {
    const p = parsePersonInput({ year: 1995, month: 3, day: 15, hourValue: "unknown" }, { genderOptional: true });
    expect(p).not.toBeNull();
    expect("gender" in p!).toBe(false);
    // 성별을 보내면 그대로 받는다 (시간은 여전히 필수)
    expect(parsePersonInput({ gender: "남", year: 1995, month: 3, day: 15, hourValue: "unknown" }, { genderOptional: true })?.gender).toBe("남");
    expect(parsePersonInput({ year: 1995, month: 3, day: 15 }, { genderOptional: true })).toBeNull();
  });

  const BASE = {
    name: "지민", gender: "여", year: 1995, month: 3, day: 15,
    hourValue: "unknown", isLunar: false, isLeap: false,
  };

  it("하위 호환 — 신규 필드가 없는 기존 입력이 그대로 통과하고, 키도 생기지 않는다", () => {
    const p = parsePersonInput(BASE)!;
    expect(p).not.toBeNull();
    // undefined 키가 생기면 inputData JSON이 오염된다
    expect("concern" in p).toBe(false);
    expect("loveStatus" in p).toBe(false);
  });

  it("상황 정보 화이트리스트 — 목록 밖 값은 조용히 무시된다 (주문 거부 금지)", () => {
    const p = parsePersonInput({
      ...BASE,
      loveStatus: "연애중", loveDuration: "1~3년",
      jobStatus: "해커", // 목록에 없음
      concernTopic: "직업·이직",
    })!;
    expect(p.loveStatus).toBe("연애중");
    expect(p.loveDuration).toBe("1~3년");
    expect("jobStatus" in p).toBe(false);
    expect(p.concernTopic).toBe("직업·이직");
  });

  it("연애 기간은 연애 상태 없이 단독으로 오면 버린다", () => {
    const p = parsePersonInput({ ...BASE, loveDuration: "5년 이상" })!;
    expect("loveDuration" in p).toBe(false);
  });

  it(`고민은 ${CONCERN_MAX}자에서 자른다`, () => {
    const p = parsePersonInput({ ...BASE, concern: "가".repeat(500) })!;
    expect(p.concern).toHaveLength(CONCERN_MAX);
  });

  it("공백뿐인 고민은 없는 것으로 취급한다", () => {
    const p = parsePersonInput({ ...BASE, concern: "   \n  " })!;
    expect("concern" in p).toBe(false);
  });
});

describe("detectCrisis (S8 — 위기 키워드 분기)", () => {
  it("위기 신호를 잡는다 (띄어쓰기·변형·영어 포함)", () => {
    for (const t of [
      "요즘 죽고 싶다는 생각이 자주 들어요",
      "죽고싶어요",
      "죽고파",
      "뒤지고 싶어요",
      "더는 살기가 싫어요", // 조사 삽입 변형
      "자해를 반복하게 됩니다",
      "그냥 다 사라지고 싶어요",
      "극단적 선택을 생각한 적이 있어요",
      "더는 살기 싫습니다",
      "손목을 그었어요",
      "유서를 써놨어요",
      "I want to kill myself",
      "thinking about suicide",
    ]) {
      expect(detectCrisis(t), `잡아야 함: ${t}`).toBe(true);
    }
  });

  it("일상 고민은 잡지 않는다 (과잉 검출 회귀 방지)", () => {
    for (const t of [
      "이직할지 말지 고민이에요",
      "남자친구와 결혼해도 될까요",
      "사업이 죽을 쑤고 있어요", // '죽'이 들어가도 위기 아님
      "월급이 너무 적어서 살림살이가 힘들어요",
      "손목시계 선물운이 궁금해요", // '손목' 단독은 위기 아님 (실제 오검출 사례)
      "손목터널증후군 때문에 이직을 고민해요",
      "유서 깊은 가문과의 결혼운이 궁금해요", // '유서' 단독은 위기 아님
      "자유서식으로 적어요",
      undefined,
    ]) {
      expect(detectCrisis(t), `잡으면 안 됨: ${String(t)}`).toBe(false);
    }
  });
});

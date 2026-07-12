// 사용자 메시지 빌더 — 계산값 XML 주입 + "재계산 금지" 재강조
// ⚠️ 가변 데이터는 전부 이 파일(user 메시지)에만 넣는다. system 프리픽스는 캐싱을 위해 불변.
import { HOUR_BRANCH_LABEL } from "../saju/constants";
import { detectJijiRelations, getMonthlyPillars } from "../saju/compute";
import type { PersonInput, SajuResult } from "../saju/types";

function birthLabel(p: PersonInput): string {
  const cal = p.isLunar ? `음력${p.isLeap ? "(윤달)" : ""}` : "양력";
  return `${cal} ${p.year}년 ${p.month}월 ${p.day}일`;
}

function hourLabel(p: PersonInput): string {
  if (p.hourValue === "unknown") return "모름";
  return HOUR_BRANCH_LABEL[p.hourValue] ?? "모름";
}

// 한 사람의 계산값 블록 (원본 USER_PROMPT_TEMPLATE 이식)
function personBlock(p: PersonInput, r: SajuResult, label?: string): string {
  const tag = label ? `_${label}` : "";
  return `<고객정보${tag}>
이름: ${p.name}
성별: ${p.gender}
생년월일: ${birthLabel(p)}
태어난 시간: ${hourLabel(p)}
</고객정보${tag}>

<계산된_팔자${tag}>
년주: ${r.pillars.year.hangul} (${r.pillars.year.hanja})
월주: ${r.pillars.month.hangul} (${r.pillars.month.hanja})
일주: ${r.pillars.day.hangul} (${r.pillars.day.hanja})
시주: ${r.pillars.hour ? `${r.pillars.hour.hangul} (${r.pillars.hour.hanja})` : "미상"}
</계산된_팔자${tag}>

<일간${tag}>${r.dayMaster.char} (${r.dayMaster.yinyang}${r.dayMaster.element})</일간${tag}>

<오행_분포_지장간반영${tag}>
${r.elementDist.map((e) => `${e.name}:${e.count.toFixed(1)}`).join(", ")}
(가중치: 천간 1.0, 지지 본기 1.0, 중기 0.3, 여기 0.2)
</오행_분포_지장간반영${tag}>

<십신${tag}>
${r.sipsin.map((s) => `${s.position} ${s.char}: ${s.label}`).join("\n")}
</십신${tag}>

<신살${tag}>
${r.sinsal.length ? r.sinsal.join(", ") : "(해당 없음)"}
</신살${tag}>`;
}

const NO_RECALC = `위 값은 결정론적 계산으로 확정된 값입니다. 절대 재계산·반박·재서술하지 마십시오.`;

// 1인 상품 (free / lifetime / career)
export function buildSingleUserPrompt(p: PersonInput, r: SajuResult): string {
  return `${personBlock(p, r)}

<세운>${r.currentYear}년 (${r.currentYearPillar.hangul} ${r.currentYearPillar.hanja})</세운>

${NO_RECALC}`;
}

// 올해 운세 — 월별 월건 간지 추가
export function buildYearUserPrompt(p: PersonInput, r: SajuResult): string {
  const monthly = getMonthlyPillars(r.currentYear)
    .map((m) => `${m.month}월: ${m.hangul}`)
    .join("\n");
  return `${personBlock(p, r)}

<세운>${r.currentYear}년 (${r.currentYearPillar.hangul} ${r.currentYearPillar.hanja})</세운>

<월별_월건간지>
${monthly}
</월별_월건간지>

${NO_RECALC}`;
}

// 궁합 (2인) — 교차 지지 관계 포함
export function buildLoveUserPrompt(
  a: { person: PersonInput; result: SajuResult },
  b: { person: PersonInput; result: SajuResult },
): string {
  const branchesOf = (r: SajuResult) => {
    const arr = [r.pillars.year.branch, r.pillars.month.branch, r.pillars.day.branch];
    if (r.pillars.hour) arr.push(r.pillars.hour.branch);
    return arr;
  };
  // 두 사주의 지지를 합쳐 교차 합충형 검출 (각자 내부 관계와 구분해 전달)
  const crossRelations = detectJijiRelations([...branchesOf(a.result), ...branchesOf(b.result)]);
  const ownA = detectJijiRelations(branchesOf(a.result));
  const ownB = detectJijiRelations(branchesOf(b.result));
  const fmt = (rel: ReturnType<typeof detectJijiRelations>) =>
    Object.entries(rel)
      .map(([k, v]) => `${k}: ${v.length ? v.join(", ") : "없음"}`)
      .join("\n");

  return `${personBlock(a.person, a.result, "A_신청자")}

${personBlock(b.person, b.result, "B_상대")}

<세운>${a.result.currentYear}년 (${a.result.currentYearPillar.hangul} ${a.result.currentYearPillar.hanja})</세운>

<지지관계_A내부>
${fmt(ownA)}
</지지관계_A내부>

<지지관계_B내부>
${fmt(ownB)}
</지지관계_B내부>

<지지관계_두사주합산>
(두 사람의 지지를 합쳐 검출한 관계 — A/B 내부 관계에 없는 항목이 교차 관계입니다)
${fmt(crossRelations)}
</지지관계_두사주합산>

${NO_RECALC}`;
}

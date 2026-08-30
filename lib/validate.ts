import { HOUR_OPTIONS } from "./saju/constants";
import {
  CONCERN_TOPIC, JOB_STATUS, LOVE_DURATION, LOVE_STATUS, type PersonInput,
} from "./saju/types";

const VALID_HOURS = new Set(HOUR_OPTIONS.map((o) => o.value));

export const CONCERN_MAX = 200;

// 화이트리스트 밖 값은 에러가 아니라 "없는 것"으로 취급한다 —
// 선택 정보가 이상하다고 주문을 거부하면 손님만 잃는다.
function pickEnum<T extends readonly string[]>(list: T, v: unknown): T[number] | undefined {
  return typeof v === "string" && (list as readonly string[]).includes(v)
    ? (v as T[number])
    : undefined;
}

// 신뢰할 수 없는 클라이언트 입력 → PersonInput 검증. 실패 시 null.
export function parsePersonInput(raw: unknown): PersonInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;

  const name = typeof o.name === "string" && o.name.trim() ? o.name.trim().slice(0, 20) : "고객";
  const gender = o.gender === "남" || o.gender === "여" ? o.gender : null;
  const year = Number(o.year);
  const month = Number(o.month);
  const day = Number(o.day);
  const hourValue = typeof o.hourValue === "string" && VALID_HOURS.has(o.hourValue) ? o.hourValue : null;

  if (!gender || !hourValue) return null;
  if (!Number.isInteger(year) || year < 1900 || year > 2050) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;

  const concern =
    typeof o.concern === "string" && o.concern.trim()
      ? o.concern.trim().slice(0, CONCERN_MAX)
      : undefined;

  const p: PersonInput = {
    name, gender, year, month, day, hourValue,
    isLunar: o.isLunar === true,
    isLeap: o.isLeap === true,
  };
  // undefined 키를 아예 만들지 않는다 — inputData JSON과 hashPersonInput의 안정성을 위해
  const loveStatus = pickEnum(LOVE_STATUS, o.loveStatus);
  const loveDuration = pickEnum(LOVE_DURATION, o.loveDuration);
  const jobStatus = pickEnum(JOB_STATUS, o.jobStatus);
  const concernTopic = pickEnum(CONCERN_TOPIC, o.concernTopic);
  if (loveStatus) p.loveStatus = loveStatus;
  // 기간은 연애 상태가 있어야만 의미가 있다 (기간만 단독으로 오면 버림)
  if (loveStatus && loveDuration) p.loveDuration = loveDuration;
  if (jobStatus) p.jobStatus = jobStatus;
  if (concernTopic) p.concernTopic = concernTopic;
  if (concern) p.concern = concern;
  return p;
}

// ── 위기 키워드 검출 (500-audit S8 — 이 분기 없이 고민 입력을 열면 안 된다) ──
//
// 목적: 자살·자해 위기 신호가 담긴 고민을 AI 해석 프롬프트에 넣지 않는 것.
// 운세 문장("죽을 운" 등)이 위기 상태의 사람에게 어떻게 읽힐지 통제할 수 없다.
// 검출되면 리포트는 정상 발급하되, 고민 미주입 + 전용 안내 문구로 대체한다.
//
// 넓게 잡되, 초고빈도 일상어와 겹치는 리터럴은 문맥을 요구한다 —
// '손목'(시계·터널증후군)과 '유서'(유서 깊은)가 단독 매칭되면 정상 결제 고객이
// 뜬금없는 자살예방 안내를 받는 오작동이 된다(적대적 리뷰에서 실증).
const CRISIS_RE =
  /자살|자해|죽고\s*(싶|파|퍼)|죽어\s*버리|죽는\s*게\s*나|살기[가는도]?\s*싫|살고\s*싶지가?\s*않|뒤지고\s*싶|사라지고\s*싶|없어지고\s*싶|목숨.{0,6}(끊|버리)|극단적\s*(선택|생각)|손목.{0,6}(긋|그[어었으]|그을|칼)|유서(를|만)?\s*(쓰|써|썼|남기|남겼|작성|준비)|생을\s*마감|더\s*이상\s*못\s*살|같이\s*죽|suicide|kill\s+myself|self[-\s]?harm|end\s+(my\s+life|it\s+all)/i;

export function detectCrisis(text: string | undefined): boolean {
  if (!text) return false;
  return CRISIS_RE.test(text.replace(/\s+/g, " "));
}

/** 위기 검출 시 리포트의 고민 답변 자리에 들어가는 안내 (AI 생성 아님 — 고정 문구) */
export const CRISIS_NOTICE = `적어주신 마음, 조심스럽게 읽었어요.

지금 느끼시는 무게는 사주로 풀 일이 아니라, 사람과 나눠야 할 일인 것 같아요. 그래서 이 부분만큼은 해석 대신 이 말씀을 드려요.

자살예방 상담전화 109 (24시간, 무료)
청소년 전화 1388

누군가에게 말하는 것이 가장 어려운 첫걸음이라는 걸 알아요. 그래도 오늘, 한 사람에게만 이 마음을 꺼내보세요. 리포트의 나머지 부분은 평소처럼 준비해두었어요 — 천천히, 편하실 때 읽으세요.`;

// 결제 고객 식별자. 이게 없으면 링크를 잃은 고객에게 재발송할 방법이 없고,
// 환불정책상 링크 유실은 전액 환불 사유라 그대로 손실이 된다.
// 비ASCII·초장문은 거부한다 — 메일 발송 단계에서 실패하느니 입력 단계에서 막는 게 낫다.
const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

export function parseEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();
  if (v.length < 6 || v.length > 254) return null;
  return EMAIL_RE.test(v) ? v : null;
}

export function hashPersonInput(p: PersonInput): string {
  // Node 전용 (서버에서만 호출)
  const { createHash } = require("node:crypto") as typeof import("node:crypto");
  // 상황 필드도 해시에 넣는다 — 무료 프롬프트에 실리는 값이라, 빼면 24시간 안에
  // 답변을 바꿔 재신청해도 옛 리포트가 재사용되어 "더 정확해져요" 약속이 거짓이 된다.
  const basis = JSON.stringify([
    p.gender, p.year, p.month, p.day, p.hourValue, p.isLunar, p.isLeap, p.name,
    p.loveStatus ?? null, p.loveDuration ?? null, p.jobStatus ?? null,
  ]);
  return createHash("sha256").update(basis).digest("hex");
}

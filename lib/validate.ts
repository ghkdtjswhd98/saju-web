import { HOUR_OPTIONS } from "./saju/constants";
import type { PersonInput } from "./saju/types";

const VALID_HOURS = new Set(HOUR_OPTIONS.map((o) => o.value));

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

  return {
    name, gender, year, month, day, hourValue,
    isLunar: o.isLunar === true,
    isLeap: o.isLeap === true,
  };
}

export function hashPersonInput(p: PersonInput): string {
  // Node 전용 (서버에서만 호출)
  const { createHash } = require("node:crypto") as typeof import("node:crypto");
  const basis = JSON.stringify([p.gender, p.year, p.month, p.day, p.hourValue, p.isLunar, p.isLeap, p.name]);
  return createHash("sha256").update(basis).digest("hex");
}

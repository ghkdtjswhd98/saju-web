"use client";

import { HOUR_OPTIONS } from "@/lib/saju/constants";

export interface PersonFormValue {
  name: string;
  gender: "남" | "여";
  calendar: "양력" | "음력";
  isLeap: boolean;
  date: string; // yyyy-mm-dd
  hourValue: string;
}

export const EMPTY_PERSON: PersonFormValue = {
  name: "",
  gender: "여",
  calendar: "양력",
  isLeap: false,
  date: "",
  hourValue: "unknown",
};

export function personToApiInput(v: PersonFormValue) {
  const [y, m, d] = v.date.split("-").map(Number);
  return {
    name: v.name,
    gender: v.gender,
    year: y,
    month: m,
    day: d,
    hourValue: v.hourValue,
    isLunar: v.calendar === "음력",
    isLeap: v.calendar === "음력" && v.isLeap,
  };
}

export default function PersonFields({
  value,
  onChange,
  namePlaceholder = "이름 (결과에 표시돼요)",
}: {
  value: PersonFormValue;
  onChange: (v: PersonFormValue) => void;
  namePlaceholder?: string;
}) {
  const set = (patch: Partial<PersonFormValue>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-ink-soft mb-1">이름</label>
        <input
          type="text"
          value={value.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder={namePlaceholder}
          maxLength={20}
          className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[15px] focus:border-accent focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-ink-soft mb-1">성별</label>
          <div className="flex gap-2">
            {(["여", "남"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => set({ gender: g })}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                  value.gender === g
                    ? "border-accent bg-accent-soft text-accent-strong font-medium"
                    : "border-line bg-white text-ink-soft"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-ink-soft mb-1">달력</label>
          <div className="flex gap-2">
            {(["양력", "음력"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set({ calendar: c })}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                  value.calendar === c
                    ? "border-accent bg-accent-soft text-accent-strong font-medium"
                    : "border-line bg-white text-ink-soft"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {value.calendar === "음력" && (
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={value.isLeap}
            onChange={(e) => set({ isLeap: e.target.checked })}
            className="accent-[var(--accent)]"
          />
          윤달이에요
        </label>
      )}

      <div>
        <label className="block text-sm text-ink-soft mb-1">
          생년월일 ({value.calendar})
        </label>
        <input
          type="date"
          value={value.date}
          min="1900-01-01"
          max="2050-12-31"
          onChange={(e) => set({ date: e.target.value })}
          className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[15px] focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm text-ink-soft mb-1">태어난 시간</label>
        <select
          value={value.hourValue}
          onChange={(e) => set({ hourValue: e.target.value })}
          className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[15px] focus:border-accent focus:outline-none"
        >
          {HOUR_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-ink-soft">
          시간을 모르면 &quot;모름&quot;으로 두세요. 년·월·일 여섯 글자만으로도 충분히 해석돼요.
        </p>
      </div>
    </div>
  );
}

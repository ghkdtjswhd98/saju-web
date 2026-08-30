"use client";

import { useEffect, useRef, useState } from "react";
import { HOUR_OPTIONS } from "@/lib/saju/constants";
import { CONCERN_TOPIC, JOB_STATUS, LOVE_DURATION, LOVE_STATUS } from "@/lib/saju/types";

export interface PersonFormValue {
  name: string;
  /** ""=미선택 — 점진 폼에서 명시적 선택을 요구한다 (기본값 실수 방지) */
  gender: "남" | "여" | "";
  calendar: "양력" | "음력";
  isLeap: boolean;
  date: string; // yyyy-mm-dd
  hourValue: string;
  // ── 선택 정보 (""=미응답) ──
  loveStatus: string;
  loveDuration: string;
  jobStatus: string;
  concernTopic: string;
  concern: string;
}

export const EMPTY_PERSON: PersonFormValue = {
  name: "",
  gender: "",
  calendar: "양력",
  isLeap: false,
  date: "",
  hourValue: "unknown",
  loveStatus: "",
  loveDuration: "",
  jobStatus: "",
  concernTopic: "",
  concern: "",
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
    // 빈 값은 보내지 않는다 — 서버 검증이 화이트리스트 밖 값을 버리긴 하지만 애초에 깨끗하게
    ...(v.loveStatus ? { loveStatus: v.loveStatus } : {}),
    ...(v.loveStatus && v.loveDuration ? { loveDuration: v.loveDuration } : {}),
    ...(v.jobStatus ? { jobStatus: v.jobStatus } : {}),
    ...(v.concernTopic ? { concernTopic: v.concernTopic } : {}),
    ...(v.concern.trim() ? { concern: v.concern.trim().slice(0, 200) } : {}),
  };
}

// ── 점진 노출 질문 순서 ─────────────────────────────────────
// 답하면 다음 질문이 아래에서 나타난다(토스식 누적형). 화면 전환 없음.
const Q = {
  name: 0,
  gender: 1,
  birth: 2,
  hour: 3,
  love: 4,
  job: 5,
  concernTopic: 6,
  concern: 7,
} as const;

function Chip({
  selected,
  onClick,
  children,
  small = false,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border transition ${small ? "px-3 py-2 text-[13px]" : "px-3 py-2.5 text-sm"} ${
        selected
          ? "border-accent bg-accent-soft font-medium text-accent-strong"
          : "border-line bg-white text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function SkipButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 text-xs text-ink-soft underline underline-offset-2"
    >
      건너뛰기 — 답하지 않아도 리포트는 만들어져요
    </button>
  );
}

// 새로 나타나는 질문의 부드러운 등장 + 스크롤 따라가기 (keyframes는 globals.css)
function Reveal({ children, active }: { children: React.ReactNode; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (active && ref.current) {
      // 새 질문이 화면 밖에서 나타나면 점진 노출의 의미가 없다
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [active]);
  return (
    <div ref={ref} className="reveal-in">
      {children}
    </div>
  );
}

export default function PersonFields({
  value,
  onChange,
  namePlaceholder = "이름 (결과에 표시돼요)",
  flow = "steps",
  withExtras = false,
  withConcern = false,
}: {
  value: PersonFormValue;
  onChange: (v: PersonFormValue) => void;
  namePlaceholder?: string;
  /** steps=토스식 점진 노출(고객용) / all=전부 한 번에(운영자 콘솔) */
  flow?: "steps" | "all";
  /** 연애·직업 상황 질문 노출 */
  withExtras?: boolean;
  /** 고민 주제·자유서술 노출 (유료 전용) */
  withConcern?: boolean;
}) {
  const set = (patch: Partial<PersonFormValue>) => onChange({ ...value, ...patch });

  // 프리필(무료→유료 이동)이면 이미 답한 데까지 전부 열어둔다.
  // reveal은 "여기까지 보여준다"는 단조 증가 카운터 — 값을 지워도 닫히지 않는다(수정 허용).
  const [reveal, setReveal] = useState(() => {
    if (flow === "all") return 99;
    if (value.concern || value.concernTopic) return Q.concern;
    if (value.jobStatus) return Q.concernTopic;
    if (value.loveStatus) return Q.job;
    if (value.date) return Q.love; // 필수 구간을 이미 채워서 온 사람
    if (value.gender) return Q.birth;
    if (value.name) return Q.gender;
    return Q.name;
  });
  const advance = (to: number) => setReveal((r) => Math.max(r, to));

  const lastQuestion = withConcern ? Q.concern : withExtras ? Q.job : Q.hour;
  const show = (q: number) => q <= Math.min(reveal, lastQuestion);

  // 시간 질문은 기본값("모름")이 유효한 답이라 값 변화만으로는 "답했는지" 알 수 없다 —
  // 상호작용 여부를 따로 기억한다. 프리필(date 존재)이면 그 흐름에서 이미 답한 것.
  const [hourTouched, setHourTouched] = useState(() => flow === "all" || Boolean(value.date));

  return (
    <div className="space-y-5">
      {/* 1. 이름 */}
      <div>
        <label className="block text-sm text-ink-soft mb-1">이름</label>
        <input
          type="text"
          value={value.name}
          onChange={(e) => {
            set({ name: e.target.value });
            if (e.target.value.trim()) advance(Q.gender);
          }}
          placeholder={namePlaceholder}
          maxLength={20}
          className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[15px] focus:border-accent focus:outline-none"
        />
      </div>

      {/* 2. 성별 */}
      {show(Q.gender) && (
        <Reveal active={reveal === Q.gender}>
          <label className="block text-sm text-ink-soft mb-1">성별</label>
          <div className="grid grid-cols-2 gap-2">
            {(["여", "남"] as const).map((g) => (
              <Chip
                key={g}
                selected={value.gender === g}
                onClick={() => {
                  set({ gender: g });
                  advance(Q.birth);
                }}
              >
                {g === "여" ? "여성" : "남성"}
              </Chip>
            ))}
          </div>
        </Reveal>
      )}

      {/* 3. 생년월일 (달력 + 윤달) */}
      {show(Q.birth) && (
        <Reveal active={reveal === Q.birth}>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm text-ink-soft">생년월일</label>
            <div className="flex gap-1.5">
              {(["양력", "음력"] as const).map((c) => (
                <Chip key={c} small selected={value.calendar === c} onClick={() => set({ calendar: c })}>
                  {c}
                </Chip>
              ))}
            </div>
          </div>
          <input
            type="date"
            value={value.date}
            min="1900-01-01"
            max="2050-12-31"
            onChange={(e) => {
              set({ date: e.target.value });
              if (e.target.value) advance(Q.hour);
            }}
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[15px] focus:border-accent focus:outline-none"
          />
          {value.calendar === "음력" && (
            <label className="mt-2 flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={value.isLeap}
                onChange={(e) => set({ isLeap: e.target.checked })}
                className="accent-[var(--accent)]"
              />
              윤달이에요
            </label>
          )}
        </Reveal>
      )}

      {/* 4. 태어난 시간 */}
      {show(Q.hour) && (
        <Reveal active={reveal === Q.hour}>
          <label className="block text-sm text-ink-soft mb-1">태어난 시간</label>
          {/* 서머타임 안내 — 1948~51·1955~60·1987~88년 5~10월은 시계가 1시간 빨랐다 (엔진 교차검증 2026-08-25) */}
          {(() => {
            const y = Number((value.date || "").slice(0, 4));
            const dst = (y >= 1948 && y <= 1951) || (y >= 1955 && y <= 1960) || y === 1987 || y === 1988;
            return dst ? (
              <p className="mb-2 rounded-lg bg-accent-soft/40 px-3 py-2 text-xs leading-5 text-accent-strong">
                ⏰ {y}년에는 서머타임이 있었어요. 5~10월 사이에 태어나셨다면, 출생 시각에서{" "}
                <b>1시간을 뺀 시간대</b>를 골라주세요. (예: 오후 2시 출생 → 오후 1시 = 미시가 아닌 오시)
              </p>
            ) : null;
          })()}
          {flow === "all" ? (
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
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {HOUR_OPTIONS.map((o) => (
                  <Chip
                    key={o.value}
                    small
                    selected={hourTouched && value.hourValue === o.value}
                    onClick={() => {
                      set({ hourValue: o.value });
                      setHourTouched(true);
                      advance(Q.love);
                    }}
                  >
                    {o.label}
                  </Chip>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-ink-soft">
                모르면 &quot;모름&quot;을 눌러주세요. 년·월·일 여섯 글자만으로도 충분히 해석돼요.
              </p>
            </>
          )}
        </Reveal>
      )}

      {/* ── 여기부터 선택 질문 — 전부 건너뛰기 가능 ── */}

      {/* 5. 연애 상태 (+기간) */}
      {withExtras && show(Q.love) && (
        <Reveal active={reveal === Q.love}>
          <label className="block text-sm text-ink-soft mb-1">
            지금 연애 상태를 알려주시면 연애·결혼 풀이가 더 정확해져요
          </label>
          <div className="grid grid-cols-3 gap-2">
            {LOVE_STATUS.map((s) => (
              <Chip
                key={s}
                selected={value.loveStatus === s}
                onClick={() => {
                  set({ loveStatus: s, loveDuration: "" });
                  advance(Q.job);
                }}
              >
                {s}
              </Chip>
            ))}
          </div>
          {value.loveStatus && (
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {LOVE_DURATION.map((d) => (
                <Chip
                  key={d}
                  small
                  selected={value.loveDuration === d}
                  onClick={() => {
                    set({ loveDuration: d });
                    advance(Q.job);
                  }}
                >
                  {d}
                </Chip>
              ))}
            </div>
          )}
          {!value.loveStatus && <SkipButton onClick={() => advance(Q.job)} />}
        </Reveal>
      )}

      {/* 6. 직업 상황 */}
      {withExtras && show(Q.job) && (
        <Reveal active={reveal === Q.job}>
          <label className="block text-sm text-ink-soft mb-1">
            지금 하시는 일은요? 직업·재물 풀이가 뜬구름을 안 잡게 돼요
          </label>
          <div className="grid grid-cols-3 gap-2">
            {JOB_STATUS.map((s) => (
              <Chip
                key={s}
                small
                selected={value.jobStatus === s}
                onClick={() => {
                  set({ jobStatus: s });
                  advance(withConcern ? Q.concernTopic : 99);
                }}
              >
                {s}
              </Chip>
            ))}
          </div>
          {!value.jobStatus && (
            <SkipButton onClick={() => advance(withConcern ? Q.concernTopic : 99)} />
          )}
        </Reveal>
      )}

      {/* 7. 고민 주제 */}
      {withConcern && show(Q.concernTopic) && (
        <Reveal active={reveal === Q.concernTopic}>
          <label className="block text-sm text-ink-soft mb-1">
            요즘 가장 마음이 쓰이는 주제가 있나요?
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CONCERN_TOPIC.map((t) => (
              <Chip
                key={t}
                small
                selected={value.concernTopic === t}
                onClick={() => {
                  set({ concernTopic: t });
                  advance(Q.concern);
                }}
              >
                {t}
              </Chip>
            ))}
          </div>
          {!value.concernTopic && <SkipButton onClick={() => advance(Q.concern)} />}
        </Reveal>
      )}

      {/* 8. 고민 자유 서술 */}
      {withConcern && show(Q.concern) && (
        <Reveal active={reveal === Q.concern}>
          <label className="block text-sm text-ink-soft mb-1">
            특별히 물어보고 싶은 게 있다면 적어주세요 — 리포트 안에 따로 답을 드려요
          </label>
          <textarea
            value={value.concern}
            onChange={(e) => set({ concern: e.target.value.slice(0, 200) })}
            rows={3}
            maxLength={200}
            placeholder="예: 지금 회사를 계속 다녀야 할지 고민이에요"
            className="w-full resize-y rounded-lg border border-line bg-white px-3 py-2.5 text-[15px] leading-6 focus:border-accent focus:outline-none"
          />
          <p className="mt-1 text-right text-xs text-ink-soft">{value.concern.length}/200</p>
        </Reveal>
      )}
    </div>
  );
}

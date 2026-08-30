"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { trackPixel } from "@/components/MetaPixel";
import PersonFields, { EMPTY_PERSON, personToApiInput, type PersonFormValue } from "./PersonFields";

type Mode = "single" | "couple";

export default function FreeForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("single");
  // /?mode=couple 진입 지원 (무료 결과의 궁합 CTA가 이 링크를 씀).
  // useSearchParams 대신 마운트 시 직접 읽는다 — 랜딩의 ISR 캐시(60초)를 깨지 않기 위해.
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("mode") === "couple") setMode("couple");
    } catch {
      /* ignore */
    }
  }, []);
  const [me, setMe] = useState<PersonFormValue>(EMPTY_PERSON);
  // 상대 성별을 미리 정하지 않는다 — 명시적 선택이 점진 노출의 전제이고, 커플 구성을 가정하지 않는다
  const [partner, setPartner] = useState<PersonFormValue>(EMPTY_PERSON);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const persons = mode === "couple" ? [me, partner] : [me];
    for (const p of persons) {
      if (!p.gender) {
        setError("성별을 선택해주세요.");
        return;
      }
      if (!p.date) {
        setError(mode === "couple" ? "두 사람의 생년월일을 모두 입력해주세요." : "생년월일을 입력해주세요.");
        return;
      }
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/free", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ persons: persons.map(personToApiInput) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "잠시 후 다시 시도해주세요.");
        return;
      }
      trackPixel("Lead"); // 무료 리포트 생성 = 광고 최적화 기준 전환
      router.push(`/free/${data.shareId}`);
    } catch {
      setError("네트워크 오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
      {/* 모드 탭 */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-bg p-1">
        {(
          [
            { key: "single", label: "나의 사주" },
            { key: "couple", label: "우리 궁합" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setMode(t.key)}
            className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
              mode === t.key ? "bg-card text-accent-strong shadow-sm" : "text-ink-soft"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* '나'의 PersonFields는 두 모드에서 같은 트리 위치를 유지해야 한다 —
          삼항으로 갈라 그리면 탭 전환마다 리마운트되어 점진 노출 상태(reveal·시간 답변 여부)가
          값 휴리스틱으로 재유도되면서 폼이 되감기거나 안 누른 답이 눌린 것처럼 표시된다.
          상황 정보(연애·직업)는 무료에서도 받는다 — 유료 프리필로 이어짐. 고민은 유료 전용. */}
      <div className="space-y-6">
        <div>
          {mode === "couple" && (
            <h3 className="mb-3 text-sm font-bold tracking-widest text-accent-strong">나</h3>
          )}
          <PersonFields value={me} onChange={setMe} withExtras />
        </div>
        {mode === "couple" && (
          <div className="border-t border-line pt-5">
            <h3 className="mb-3 text-sm font-bold tracking-widest text-accent-strong">상대</h3>
            <PersonFields
              value={partner}
              onChange={setPartner}
              namePlaceholder="상대 이름 (또는 별칭)"
            />
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="mt-5 w-full rounded-xl bg-accent-strong px-4 py-3.5 text-[15px] font-bold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {loading
          ? "계산 중..."
          : mode === "couple"
            ? "무료로 우리 케미 보기"
            : "무료로 내 사주 보기"}
      </button>
      <p className="mt-2 text-center text-xs text-ink-soft">회원가입 없음 · 30초 완성 · 하루 3회 무료</p>
    </div>
  );
}

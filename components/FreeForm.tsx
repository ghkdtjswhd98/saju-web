"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trackPixel } from "@/components/MetaPixel";
import PersonFields, { EMPTY_PERSON, personToApiInput, type PersonFormValue } from "./PersonFields";

type Mode = "single" | "couple";

export default function FreeForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("single");
  const [me, setMe] = useState<PersonFormValue>(EMPTY_PERSON);
  const [partner, setPartner] = useState<PersonFormValue>({ ...EMPTY_PERSON, gender: "남" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const persons = mode === "couple" ? [me, partner] : [me];
    for (const p of persons) {
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

      {mode === "single" ? (
        <PersonFields value={me} onChange={setMe} />
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-bold tracking-widest text-accent-strong">나</h3>
            <PersonFields value={me} onChange={setMe} />
          </div>
          <div className="border-t border-line pt-5">
            <h3 className="mb-3 text-sm font-bold tracking-widest text-accent-strong">상대</h3>
            <PersonFields
              value={partner}
              onChange={setPartner}
              namePlaceholder="상대 이름 (또는 별칭)"
            />
          </div>
        </div>
      )}

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

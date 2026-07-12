"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PersonFields, { EMPTY_PERSON, personToApiInput, type PersonFormValue } from "./PersonFields";

export default function FreeForm() {
  const router = useRouter();
  const [person, setPerson] = useState<PersonFormValue>(EMPTY_PERSON);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!person.date) {
      setError("생년월일을 입력해주세요.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/free", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(personToApiInput(person)),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "잠시 후 다시 시도해주세요.");
        return;
      }
      router.push(`/free/${data.shareId}`);
    } catch {
      setError("네트워크 오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
      <PersonFields value={person} onChange={setPerson} />
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="mt-5 w-full rounded-xl bg-accent-strong px-4 py-3.5 text-[15px] font-bold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "사주 계산 중..." : "무료로 내 사주 보기"}
      </button>
      <p className="mt-2 text-center text-xs text-ink-soft">회원가입 없음 · 30초 완성 · 하루 3회 무료</p>
    </div>
  );
}

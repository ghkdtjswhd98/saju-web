"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Orobi from "@/components/Orobi";
import { QUESTIONS, scoreAnswers, type ElementKey } from "@/lib/ohaeng-test";

export default function OhaengQuiz() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<ElementKey[]>([]);

  function pick(element: ElementKey) {
    const next = [...answers, element];
    if (next.length === QUESTIONS.length) {
      const { main, sub } = scoreAnswers(next);
      router.push(`/test/ohaeng/${main}?sub=${sub}`);
      return;
    }
    setAnswers(next);
    setStep(step + 1);
  }

  if (!started) {
    return (
      <div className="rounded-2xl border border-line bg-card p-6 text-center">
        <div className="flex justify-center">
          <Orobi size={96} />
        </div>
        <p className="mt-2 text-3xl">🌱🔥⛰️💎🌊</p>
        <h2 className="mt-3 text-lg font-bold leading-snug">
          12개 질문이면 나의 기운이 보여요
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          동양에서 수천 년 동안 사람을 읽어온 다섯 가지 기운, 오행.
          <br />
          나는 어떤 기운으로 사는 사람일까요?
        </p>
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="mt-5 w-full rounded-xl bg-accent-strong px-4 py-3.5 text-[15px] font-bold text-white transition hover:opacity-90"
        >
          1분 테스트 시작하기
        </button>
        <p className="mt-2 text-xs text-ink-soft">회원가입 없음 · 무료 · 결과 공유 가능</p>
      </div>
    );
  }

  const q = QUESTIONS[step];
  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg">
        <div
          className="h-full rounded-full bg-accent-strong transition-all duration-300"
          style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-ink-soft">
        {step + 1} / {QUESTIONS.length}
      </p>
      <h2 className="mt-1 text-[17px] font-bold leading-snug">{q.q}</h2>
      <div className="mt-4 space-y-2.5">
        {q.options.map((o) => (
          <button
            key={o.text}
            type="button"
            onClick={() => pick(o.element)}
            className="w-full rounded-xl border border-line bg-bg px-4 py-3.5 text-left text-sm leading-5 transition hover:border-accent hover:bg-accent-soft/30"
          >
            {o.text}
          </button>
        ))}
      </div>
    </div>
  );
}

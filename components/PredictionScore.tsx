"use client";

// 예측 성적표 — 오롭미는 예측을 지우지 않는다.
// 30일 뒤부터 열리고, 빗나간 채점도 그대로 기록한다. 이 정직함이 차별화의 심장.
import { useState } from "react";

interface Grade {
  verdict: "hit" | "half" | "miss";
  note?: string;
  at: string;
  daysAfter?: number;
}

const LABELS: Record<Grade["verdict"], string> = {
  hit: "맞았어요",
  half: "반은 맞았어요",
  miss: "빗나갔어요",
};

export default function PredictionScore({
  token,
  createdAtIso,
  initialGrade,
}: {
  token: string;
  createdAtIso: string;
  initialGrade: Grade | null;
}) {
  const [grade, setGrade] = useState<Grade | null>(initialGrade);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const madeAt = new Date(createdAtIso);
  const days = Math.floor((Date.now() - madeAt.getTime()) / 86400000);
  const opensIn = 30 - days;
  const dateLabel = `${madeAt.getFullYear()}년 ${madeAt.getMonth() + 1}월 ${madeAt.getDate()}일`;

  async function submit(verdict: Grade["verdict"]) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${token}/grade`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ verdict, note }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(json.error ?? "잠시 후 다시 시도해주세요.");
        return;
      }
      setGrade({ verdict, note, at: new Date().toISOString() });
    } catch {
      setError("네트워크 오류예요. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-card p-5">
      <h2 className="text-sm font-bold tracking-widest text-accent-strong">예측 성적표</h2>
      <p className="mt-2 text-xs leading-5 text-ink-soft">
        이 리포트의 시간 예측은 <b>{dateLabel}</b>에 기록됐어요. 오롭미는 예측을 지우지 않아요 —
        시간이 지나 다시 오셨다면, 직접 채점해주세요. 빗나간 채점도 그대로 남깁니다.
      </p>

      {grade ? (
        <div className="mt-3 rounded-xl bg-bg px-4 py-3">
          <p className="text-sm font-bold">
            {grade.verdict === "hit" ? "🎯" : grade.verdict === "half" ? "➗" : "💨"}{" "}
            {LABELS[grade.verdict]}
          </p>
          {grade.note && <p className="mt-1 text-xs text-ink-soft">“{grade.note}”</p>}
          <p className="mt-2 text-xs text-ink-soft">
            {grade.verdict === "miss"
              ? "채점 감사해요. 빗나간 기록도 오롭미의 일부로 남겨둘게요 — 이게 저희가 일하는 방식이에요."
              : "채점 감사해요! 다음 시간의 흐름이 궁금해지셨다면 올해 운세 리포트가 이어서 답해드려요."}
          </p>
        </div>
      ) : days < 30 ? (
        <p className="mt-3 rounded-xl bg-bg px-4 py-3 text-xs text-ink-soft">
          🗓 채점은 <b>{opensIn}일 뒤</b>에 열려요. 이 페이지를 저장해두고, 시간이 예측을 검증할
          때쯤 다시 와주세요.
        </p>
      ) : (
        <div className="mt-3">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            placeholder="어떤 부분이 맞았나요? (선택)"
            className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(Object.keys(LABELS) as Grade["verdict"][]).map((v) => (
              <button
                key={v}
                onClick={() => submit(v)}
                disabled={busy}
                className="rounded-xl border border-line bg-bg px-2 py-2.5 text-sm font-bold transition hover:border-accent disabled:opacity-40"
              >
                {v === "hit" ? "🎯" : v === "half" ? "➗" : "💨"} {LABELS[v]}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

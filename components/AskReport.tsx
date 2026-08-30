"use client";

// 리포트에게 이어서 묻기 — 유료 리포트당 1회 무료.
// 답변 후에는 재구매 사다리로 연결한다 (다음 궁금증 → 다음 상품).
import { useState } from "react";
import Link from "next/link";

interface Qa {
  q: string;
  a: string;
  at: string;
}

export default function AskReport({ token, initialQa }: { token: string; initialQa: Qa | null }) {
  const [qa, setQa] = useState<Qa | null>(initialQa);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (busy || question.trim().length < 5) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${token}/ask`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const json = (await res.json()) as { answer?: string; error?: string };
      if (!res.ok || !json.answer) {
        setError(json.error ?? "잠시 후 다시 시도해주세요.");
        return;
      }
      setQa({ q: question, a: json.answer, at: new Date().toISOString() });
    } catch {
      setError("네트워크 오류예요. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-card p-5">
      <h2 className="text-sm font-bold tracking-widest text-accent-strong">
        리포트에게 하나 더 물어보기
      </h2>

      {qa ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-xl bg-bg px-4 py-3">
            <p className="text-xs font-bold text-ink-soft">내 질문</p>
            <p className="mt-1 text-sm">{qa.q}</p>
          </div>
          <div className="rounded-xl bg-accent-soft/40 px-4 py-3">
            <p className="text-xs font-bold text-accent-strong">오롭미의 답</p>
            <div className="mt-1 space-y-2 text-sm leading-7">
              {qa.a.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
          <Link
            href="/products"
            className="block rounded-xl border border-line bg-bg px-4 py-3 text-center text-sm font-bold transition hover:border-accent"
          >
            더 깊은 질문이 남았다면 → 다른 리포트 보기
          </Link>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-xs text-ink-soft">
            리포트를 읽고 궁금한 점 하나를 물어보세요. 이 리포트의 계산값을 근거로 답해드려요.
            (리포트당 1회 무료)
          </p>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="예: 리포트에 나온 전환점이 이직에도 해당되나요?"
            className="mt-3 w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-accent"
          />
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          <button
            onClick={submit}
            disabled={busy || question.trim().length < 5}
            className="mt-2 w-full rounded-xl bg-accent-strong px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "답을 쓰는 중이에요… (30초~1분)" : "무료로 물어보기"}
          </button>
        </div>
      )}
    </section>
  );
}

"use client";

import { useState } from "react";

// 리포트 하단 후기 작성 — 토큰 보유자만 접근 가능한 페이지에서 렌더되므로 별도 인증 불필요
export default function ReviewForm({
  token,
  initial,
}: {
  token: string;
  initial: { rating: number; text: string } | null;
}) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [text, setText] = useState(initial?.text ?? "");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">(
    initial ? "done" : "idle",
  );
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(!initial);

  async function submit() {
    if (rating < 1) {
      setError("별점을 선택해주세요.");
      return;
    }
    setState("saving");
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, rating, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "잠시 후 다시 시도해주세요.");
      setState("done");
      setEditing(false);
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "잠시 후 다시 시도해주세요.");
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-card p-5">
      <h2 className="text-sm font-bold">리포트가 도움이 됐나요?</h2>
      <p className="mt-0.5 text-xs text-ink-soft">
        남겨주신 후기는 익명({"○**"} 형태)으로 소개돼요.
      </p>

      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={!editing}
            onClick={() => setRating(n)}
            aria-label={`별점 ${n}점`}
            className={`text-2xl transition ${
              n <= rating ? "text-amber-400" : "text-line"
            } ${editing ? "hover:scale-110" : "cursor-default"}`}
          >
            ★
          </button>
        ))}
      </div>

      {editing ? (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="어떤 점이 와닿았는지 한 줄 남겨주세요 (5자 이상)"
            className="mt-3 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          <button
            type="button"
            onClick={submit}
            disabled={state === "saving"}
            className="mt-2 w-full rounded-xl bg-accent-strong px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {state === "saving" ? "등록 중..." : initial ? "후기 수정하기" : "후기 남기기"}
          </button>
        </>
      ) : (
        <div className="mt-2">
          <p className="text-sm leading-6">{text}</p>
          <p className="mt-1 text-xs text-ink-soft">
            소중한 후기 감사해요!{" "}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-accent-strong underline"
            >
              수정하기
            </button>
          </p>
        </div>
      )}
    </section>
  );
}

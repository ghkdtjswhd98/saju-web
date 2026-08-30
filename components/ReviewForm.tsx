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
  const [coupon, setCoupon] = useState<{ code: string; benefit: string } | null>(null);

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
      if (data.coupon) setCoupon(data.coupon);
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
      <p className="mt-0.5 text-xs leading-5 text-ink-soft">
        남겨주신 후기는 익명({"○**"} 형태)으로 소개돼요.
      </p>
      {/* 리워드를 미리 알려야 작성률이 오른다(무고지 2~3% → 고지 10%대).
          별점과 무관하게 준다는 점을 명시해야 대가성 리뷰 유도가 아니게 된다. */}
      {editing && (
        <p className="mt-2 rounded-xl bg-accent-soft/40 px-3 py-2 text-xs leading-5 text-accent-strong">
          🎁 후기를 남겨주시면 <b>올해 운세 리포트 1회 무료</b> 쿠폰을 드려요.
          <br />
          별점과 상관없이 드립니다. 낮은 점수도 그대로 남겨주세요 — 그게 저희한테 제일 필요해요.
        </p>
      )}

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
          {coupon && (
            <div className="mt-3 rounded-xl border-2 border-accent bg-accent-soft/30 p-3.5">
              <p className="text-xs font-bold text-accent-strong">🎁 {coupon.benefit} 쿠폰</p>
              <p className="mt-1.5 select-all font-mono text-lg font-bold tracking-wider">
                {coupon.code}
              </p>
              <p className="mt-1.5 text-xs leading-5 text-ink-soft">
                이 코드를 캡처해두세요. 당근 채팅이나 메일로 코드를 보내주시면 올해 운세 리포트를
                무료로 만들어 보내드려요. 유효기간은 없어요.
              </p>
            </div>
          )}
          <p className="mt-2 text-xs text-ink-soft">
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

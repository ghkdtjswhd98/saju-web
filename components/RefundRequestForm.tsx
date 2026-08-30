"use client";

import { useState } from "react";

// 환불·불만 접수 폼 — 메일 쓰는 마찰을 없애는 것이 목적.
// 불만이 후기로 터지기 전에 우리에게 먼저 오게 하는 것이 이 폼의 존재 이유다.
export default function RefundRequestForm() {
  const [reportToken, setReportToken] = useState("");
  const [reason, setReason] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit() {
    setError("");
    // 링크 전체를 붙여넣는 사람이 대부분이라 토큰만 뽑아준다 (되묻지 않기 위해)
    const token = reportToken.trim().replace(/^.*\/report\//, "").replace(/[/?#].*$/, "");
    if (!token) {
      setError("리포트 링크 또는 주문번호를 적어주세요.");
      return;
    }
    if (reason.trim().length < 10) {
      setError("어떤 점이 부족했는지 열 글자 이상 적어주세요.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/refund-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reportToken: token, reason: reason.trim(), contact: contact.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "잠시 후 다시 시도해주세요.");
        return;
      }
      setDone(true);
    } catch {
      setError("네트워크 오류가 났어요. 메일로 연락 주셔도 됩니다.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border-2 border-accent bg-accent-soft/30 p-5">
        <p className="text-sm font-bold text-accent-strong">접수됐어요.</p>
        <p className="mt-1.5 text-sm leading-6 text-ink-soft">
          영업일 기준 1~3일 안에 확인하고 처리해드릴게요. 남겨주신 내용은 리포트를 고치는 데 쓰겠습니다.
          <br />
          솔직하게 적어주셔서 고맙습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h2 className="text-[15px] font-bold">환불·불만 접수</h2>
      <p className="mt-1 text-sm leading-6 text-ink-soft">
        메일 쓰기 번거로우시면 여기서 바로 접수하세요.
      </p>
      <div className="mt-4 space-y-3">
        <input
          value={reportToken}
          onChange={(e) => setReportToken(e.target.value)}
          placeholder="리포트 링크 (또는 주문번호)"
          className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="어떤 점이 부족했나요? 구체적일수록 저희가 고칠 수 있어요. (예: 직업운 내용이 두루뭉술했어요 / 제 얘기 같지 않았어요)"
          className="w-full resize-y rounded-xl border border-line bg-bg px-3 py-2.5 text-sm leading-6 outline-none focus:border-accent"
        />
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="회신받을 이메일 (선택)"
          className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="w-full rounded-xl bg-accent-strong px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "접수 중…" : "접수하기"}
        </button>
      </div>
    </div>
  );
}

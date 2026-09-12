"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveOwnerKey, trackChemi } from "./chemi-client";

// 무료 결과 → 케미 초대 링크 생성 (shareId만 보내면 서버가 저장된 사주 스냅샷에서 파생값만 뽑는다)
export default function ChemiInviteButton({ shareId }: { shareId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chemi/links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shareId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "잠시 후 다시 시도해주세요.");
        return;
      }
      saveOwnerKey(data.code, data.ownerKey);
      trackChemi("chemi_create", { source: "free" });
      router.push(`/chemi/${data.code}?me=1`);
    } catch {
      setError("네트워크 오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={create}
        disabled={loading}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-accent bg-accent-soft/40 px-4 py-3 text-sm font-bold text-accent-strong transition hover:bg-accent-soft/70 disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M15.5 14.5a5 5 0 0 1 6 4.5" />
        </svg>
        {loading ? "링크 만드는 중..." : "친구에게 우리 케미 물어보기"}
      </button>
      <p className="mt-1.5 text-center text-[11px] text-ink-soft">
        친구는 생일만 넣으면 돼요 · 누가 나랑 제일 잘 맞는지 순위가 쌓여요
      </p>
      {error && (
        <p role="alert" className="mt-1.5 text-center text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

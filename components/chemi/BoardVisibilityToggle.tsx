"use client";

import LockIcon from "./LockIcon";

// 주인 화면 상단 토글 — "순위판 친구에게 공개 / 나만 보기". role=switch, 터치 영역 44px 이상.
// 저장은 부모(ChemiLanding)가 PATCH로 하고 실패하면 되돌린다 — 여기서는 상태만 그린다.
export default function BoardVisibilityToggle({
  isPublic,
  disabled,
  onChange,
}: {
  isPublic: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isPublic}
      disabled={disabled}
      onClick={() => onChange(!isPublic)}
      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3 text-left transition disabled:opacity-60"
    >
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
          {!isPublic && <LockIcon size={14} className="shrink-0 text-accent-strong" />}
          {isPublic ? "순위판 친구에게 공개" : "순위판 나만 보기"}
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-ink-soft">
          {isPublic ? "친구에게 상위 5명까지 보여요" : "친구는 자기 결과만 보고, 순위판은 나에게만 쌓여요"}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${isPublic ? "bg-accent-strong" : "bg-line"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full border border-line bg-card shadow-sm transition-[left] ${
            isPublic ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

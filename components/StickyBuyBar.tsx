"use client";

// 상세페이지 하단 고정 구매 바 — 압구정연애박사 벤치마킹(카운트다운 + 풀와이드 CTA).
// ⚠️ 이 카운트다운은 진짜다: lib/launch.ts의 LAUNCH_END가 지나면 pricing이 실제로 정가를 적용한다.
import { useEffect, useState } from "react";
import Link from "next/link";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export default function StickyBuyBar({
  code,
  current,
  list,
  launchEndIso,
  twoPerson,
}: {
  code: string;
  current: number;
  list: number;
  launchEndIso: string;
  twoPerson: boolean;
}) {
  const [msLeft, setMsLeft] = useState<number | null>(null);

  useEffect(() => {
    const end = new Date(launchEndIso).getTime();
    const tick = () => setMsLeft(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [launchEndIso]);

  const discounted = current < list;
  const active = msLeft !== null && msLeft > 0 && discounted;
  const d = active ? Math.floor(msLeft! / 86400000) : 0;
  const h = active ? Math.floor((msLeft! % 86400000) / 3600000) : 0;
  const m = active ? Math.floor((msLeft! % 3600000) / 60000) : 0;
  const s = active ? Math.floor((msLeft! % 60000) / 1000) : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[#17131F]/90 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur">
      <div className="mx-auto flex max-w-[430px] items-center gap-3">
        <div className="min-w-0">
          {active ? (
            <p className="text-[11px] font-bold text-danger">
              오픈 특가 종료까지 {d > 0 ? `${d}일 ` : ""}
              {pad(h)}:{pad(m)}:{pad(s)}
            </p>
          ) : (
            <p className="text-[11px] text-ink-soft">지금 바로 받아볼 수 있어요</p>
          )}
          <p className="text-[15px] font-bold text-accent-strong">
            {discounted && (
              <span className="mr-1.5 text-xs font-normal text-[#8A8398] line-through">
                {list.toLocaleString()}원
              </span>
            )}
            {current.toLocaleString()}원
          </p>
        </div>
        <Link
          href={`/checkout/new?product=${code}`}
          className="flex-1 rounded-xl bg-[#FFE9A8] px-4 py-3.5 text-center text-[15px] font-bold text-[#272132] transition hover:opacity-90"
        >
          {twoPerson ? "두 사람 정보 입력하기" : "내 정보 입력하기"}
        </Link>
      </div>
    </div>
  );
}

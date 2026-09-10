"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 공통 헤더 — 홈("/")에서만 딥네이비(theme-night). 다른 페이지는 기존 라이트 헤더 마크업 그대로 유지(회귀 방지).
export default function SiteHeader() {
  const isHome = usePathname() === "/";

  if (!isHome) {
    return (
      <header className="border-b border-line bg-card/70 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-xl px-5 py-3 flex items-center justify-between">
          {/* 로고는 원래 클래스 유지 — inline-flex로 바꾸면 '오롭미'와 '| All of Me' 사이 공백이 사라진다 */}
          <Link href="/" className="font-bold tracking-tight text-ink">
            오롭미 <span className="text-ink-soft font-normal text-sm">| All of Me</span>
          </Link>
          {/* 히트 영역 44px — px/-mr로 우측 확장, -my-2.5로 헤더 높이(48px)는 그대로 */}
          <Link
            href="/products"
            className="-my-2.5 -mr-3 inline-flex min-h-11 items-center px-3 text-sm text-accent-strong font-medium hover:underline"
          >
            심층 리포트
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="theme-night sticky top-0 z-10 border-b border-line bg-[#272132]/80 text-ink backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[430px] items-center justify-between px-5">
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="text-[19px] font-bold tracking-[-0.5px] text-[#F2EEF9]">오롭미</span>
          <span className="text-[11px] font-medium tracking-[1px] text-ink-soft">ALL OF ME</span>
        </Link>
        {/* 리포트 아이콘 링크 — 40px 박스에 -mr로 우측 여백을 흡수해 히트 영역 확보 */}
        <Link
          href="/products"
          aria-label="심층 리포트"
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-xl text-accent hover:bg-card"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5" />
            <path d="M9 13h6M9 17h6" />
          </svg>
        </Link>
      </div>
    </header>
  );
}

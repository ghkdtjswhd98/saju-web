import Link from "next/link";

// 공통 헤더 — body가 theme-night라 모든 경로에서 같은 다크 마크업(경로 분기 없음)
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-[#272132]/80 text-ink backdrop-blur">
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

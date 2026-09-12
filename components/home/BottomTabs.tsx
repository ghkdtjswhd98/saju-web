"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 하단 5탭 — layout에서 렌더하되 탐색용 경로에서만 보인다. 활성 탭 1개만 금박, 나머지는 보라빛 회색.
// 수다방은 아직 없으므로 링크 없이 "준비 중" 뱃지 + aria-disabled.
const ACTIVE = "#FFE9A8";
const IDLE = "#B9A9DD";

// 결제·리포트·법률 페이지는 탭을 숨긴다(상품 상세는 StickyBuyBar와 겹쳐서 제외)
function showTabs(pathname: string): boolean {
  if (pathname === "/" || pathname === "/products") return true;
  return ["/chemi", "/test/ohaeng", "/ilgan"].some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function HomeIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}
function StarIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z" />
    </svg>
  );
}
function ReportIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}
function CoupleIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="12" r="5" />
      <circle cx="15" cy="12" r="5" />
    </svg>
  );
}
function ChatIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z" />
    </svg>
  );
}

export default function BottomTabs() {
  const pathname = usePathname();
  const homeActive = pathname === "/";
  const productsActive = pathname === "/products";
  const itemCls = "flex min-h-16 flex-col items-center justify-center gap-1";
  const labelCls = "text-[10px] leading-none";
  const activeLabel = "font-bold text-[#FFE9A8]";
  const idleLabel = "font-medium text-ink-soft";

  if (!showTabs(pathname)) return null;

  return (
    // id는 globals.css가 "홈 = 하단 탭이 있는 페이지"를 판별해 공통 푸터에 탭 높이만큼 여백을 주는 데 쓴다
    <nav
      id="home-bottom-tabs"
      aria-label="하단 메뉴"
      className="fixed inset-x-0 bottom-0 z-20"
    >
      <div
        className="mx-auto grid max-w-[430px] grid-cols-5 border-t border-line bg-[#221C2F] px-1.5"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <Link href="/" className={itemCls} aria-current={homeActive ? "page" : undefined}>
          <HomeIcon color={homeActive ? ACTIVE : IDLE} />
          <span className={`${labelCls} ${homeActive ? activeLabel : idleLabel}`}>홈</span>
        </Link>
        {/* 홈에서는 같은 페이지 앵커(스크롤만), 다른 페이지에서는 홈의 폼으로 이동 — 둘 다 a로 충분하다 */}
        <a href={homeActive ? "#free" : "/#free"} className={itemCls}>
          <StarIcon color={IDLE} />
          <span className={`${labelCls} ${idleLabel}`}>무료사주</span>
        </a>
        <Link href="/products" className={itemCls} aria-current={productsActive ? "page" : undefined}>
          <ReportIcon color={productsActive ? ACTIVE : IDLE} />
          <span className={`${labelCls} ${productsActive ? activeLabel : idleLabel}`}>리포트</span>
        </Link>
        {/* FreeForm이 mode를 마운트 시 1회만 읽어서, Link(소프트 내비게이션)로는 궁합 모드가 안 켜진다 — 새 요청으로 보내고 #free로 폼까지 스크롤 */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- 위 이유로 의도된 전체 이동 */}
        <a href="/?mode=couple#free" className={itemCls}>
          <CoupleIcon color={IDLE} />
          <span className={`${labelCls} font-medium text-ink-soft`}>궁합</span>
        </a>
        <span aria-disabled="true" className={`${itemCls} cursor-default`}>
          <ChatIcon color={IDLE} />
          <span className="flex items-center gap-[3px] whitespace-nowrap">
            <span className={`${labelCls} font-medium text-ink-soft`}>수다방</span>
            <span className="flex h-3.5 items-center rounded-full bg-accent-soft px-[5px] text-[8px] font-bold text-[#CFC8DD]">
              준비 중
            </span>
          </span>
        </span>
      </div>
    </nav>
  );
}

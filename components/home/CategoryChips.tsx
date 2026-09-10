// 카테고리 칩 행 — 페이지 내 섹션 앵커로만 이동(필터 아님). 첫 칩 "전체"만 금박 활성.
const CHIPS: { label: string; href: string; active?: boolean }[] = [
  { label: "전체", href: "#top", active: true },
  { label: "연애", href: "#rail-love" },
  { label: "재회", href: "#rail-love" },
  { label: "결혼", href: "#rail-love" },
  { label: "재물", href: "#rail-money" },
  { label: "직업", href: "#rail-money" },
  { label: "종합", href: "#rail-reco" },
];

export default function CategoryChips() {
  return (
    <nav aria-label="카테고리" className="no-scrollbar flex gap-2 overflow-x-auto whitespace-nowrap px-5">
      {CHIPS.map((c) => (
        // 앵커 자체를 44px 높이로 잡아 히트 영역을 확보하고, 보이는 알약은 30px
        <a key={c.label} href={c.href} className="flex h-11 shrink-0 items-center">
          <span
            className={
              c.active
                ? "flex h-[30px] items-center rounded-full bg-[#FFE9A8] px-3.5 text-[13px] font-bold text-[#272132]"
                : "flex h-[30px] items-center rounded-full border border-line px-3.5 text-[13px] font-medium text-[#CFC8DD]"
            }
          >
            {c.label}
          </span>
        </a>
      ))}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { PriceTag } from "@/components/PriceTag";

export interface PosterCarouselItem {
  code: string;
  shortName: string;
  cardTitle: string;
  pdfPages: number;
  current: number;
  list: number;
  bg: string; // 포스터 로딩 전 자리표시 색(POSTER_BG)
}

// 카드 사이 간격(px) — 아래 gap-3과 반드시 같아야 인디케이터 계산이 맞는다
const GAP = 12;

// 전면 포스터 캐러셀 — 카드 폭 87% + 다음 카드 살짝 노출, 스크롤 스냅, "n / N" 인디케이터
export default function PosterCarousel({
  items,
  launchBadge,
}: {
  items: PosterCarouselItem[];
  launchBadge?: string; // 서버에서 isLaunchActive()일 때만 내려온다 — 가짜 마감 금지
}) {
  const [index, setIndex] = useState(1);

  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const card = el.querySelector<HTMLElement>("[data-card]");
    if (!card) return;
    // 카드 폭+gap 단위로 반올림해 현재 카드를 구한다(스냅 중간값도 가까운 카드로)
    const step = card.offsetWidth + GAP;
    const next = Math.min(items.length, Math.max(1, Math.round(el.scrollLeft / step) + 1));
    if (next !== index) setIndex(next);
  }

  return (
    <section className="relative">
      {/* 포커스 가능한 스크롤 영역 표준 패턴: role=region + 이름 + tabindex=0 — 접근 이름을 포커스 요소에 직접 둔다 */}
      <div
        role="region"
        aria-label="추천 리포트 포스터"
        tabIndex={0}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-5 px-5 pt-3 outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {items.map((it) => (
          <Link
            key={it.code}
            href={`/products/${it.code}`}
            data-card
            // 목업 카드 폭 = 0.87×(섹션폭−20). %는 px-5 컨테이너의 content-box(섹션폭−40) 기준이라 17.4px를 더해 맞춘다
            className="flex w-[calc(87%+17.4px)] shrink-0 snap-start flex-col"
          >
            <div className="relative overflow-hidden rounded-[18px] bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element -- 자체 생성 라우트라 최적화 불필요 */}
              <img
                src={`/brand/poster/${it.code}`}
                alt="" // 캡션(shortName·제목·가격)이 링크 이름을 이미 구성하므로 장식 이미지로 두어 중복 낭독을 막는다
                width={900}
                height={600}
                loading={it.code === items[0]?.code ? "eager" : "lazy"}
                fetchPriority={it.code === items[0]?.code ? "high" : undefined}
                style={{ backgroundColor: it.bg }}
                className="aspect-[3/2] w-full object-cover"
              />
              {launchBadge && (
                <span className="absolute left-3 top-3 flex h-6 items-center rounded-full bg-[#FFE9A8]/90 px-2.5 text-[11px] font-bold text-[#272132]">
                  {launchBadge}
                </span>
              )}
            </div>
            <div className="mt-2.5 flex flex-col gap-0.5">
              <p className="text-xs leading-[18px] text-ink-soft">
                {it.shortName} · PDF {it.pdfPages}p
              </p>
              <p className="truncate text-[15px] font-bold leading-[22px] text-ink">{it.cardTitle}</p>
              <p className="leading-6">
                <PriceTag current={it.current} list={it.list} size="sm" />
              </p>
            </div>
          </Link>
        ))}
      </div>
      {/* 우상단 인디케이터 — 첫 카드 오른쪽 모서리에서 12px 안쪽.
          카드 오른쪽 끝 = 20(패딩) + 0.87W − 17.4 = 0.87W + 2.6 → 섹션 우측에서 0.13W − 2.6, 여기에 12px 안쪽 = 13% + 9.4px */}
      <div
        aria-live="polite"
        className="pointer-events-none absolute right-[calc(13%+9.4px)] top-6 flex h-6 items-center rounded-full bg-[#17131F]/65 px-2.5 text-[11px] font-medium tracking-[0.5px] text-ink"
      >
        {index} / {items.length}
      </div>
    </section>
  );
}

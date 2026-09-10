import Link from "next/link";
import { PriceTag } from "@/components/PriceTag";
import { POSTER_BG } from "@/lib/poster-art";
import type { PricingInfo } from "@/lib/pricing";
import { PRODUCTS, type ProductCode } from "@/lib/products";

// 가로 스크롤 상품 레일 — 카드 200px, 3:2 포스터 + 캡션(제목 2줄·가격). 2인 상품은 "2인" 뱃지.
export default function ProductRail({
  id,
  title,
  subtitle,
  codes,
  pricing,
}: {
  id?: string; // 카테고리 칩 앵커(#rail-love 등)
  title: string;
  subtitle: string;
  codes: ProductCode[];
  pricing: PricingInfo;
}) {
  return (
    // scroll-mt로 sticky 헤더(56px)에 가려지지 않게 앵커 이동 위치를 내린다
    <section id={id} className="scroll-mt-16 pt-6">
      <div className="flex items-center justify-between px-5">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[17px] font-bold text-ink">{title}</h2>
          <p className="text-xs text-ink-soft">{subtitle}</p>
        </div>
        <Link
          href="/products"
          className="-my-2 flex min-h-11 items-center gap-0.5 text-xs text-ink-soft hover:text-ink"
        >
          전체보기
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
      {/* 포커스 가능한 스크롤 영역 표준 패턴: role=region + 이름 + tabindex=0 — 키보드 사용자가 무엇을 스크롤하는지 알 수 있게 */}
      <div
        role="region"
        aria-label={title}
        tabIndex={0}
        className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto px-5 outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {codes.map((code) => {
          const p = PRODUCTS[code];
          const price = pricing.prices[code];
          return (
            <Link key={code} href={`/products/${code}`} className="flex w-[200px] shrink-0 flex-col gap-2">
              <div className="relative overflow-hidden rounded-xl bg-card">
                {/* eslint-disable-next-line @next/next/no-img-element -- 자체 생성 라우트라 최적화 불필요 */}
                <img
                  src={`/brand/poster/${code}`}
                  alt="" // 캡션(제목·가격)이 링크 이름을 이미 구성하므로 장식 이미지로 두어 중복 낭독을 막는다
                  width={900}
                  height={600}
                  loading="lazy"
                  style={{ backgroundColor: POSTER_BG[code] }}
                  className="aspect-[3/2] w-full object-cover"
                />
                {p.personCount === 2 && (
                  <span className="absolute left-2 top-2 flex h-5 items-center rounded-full bg-[#FFE9A8]/90 px-[7px] text-[10px] font-bold text-[#272132]">
                    2인
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <p className="line-clamp-2 h-9 text-[13px] font-medium leading-[18px] text-ink">{p.cardTitle}</p>
                <p>
                  <PriceTag current={price.current} list={price.list} size="sm" />
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

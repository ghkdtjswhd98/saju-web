import type { Metadata } from "next";
import Link from "next/link";
import { PriceCounter, PriceTag } from "@/components/PriceTag";
import ReviewList from "@/components/ReviewList";
import { getPricing } from "@/lib/pricing";
import { PRODUCTS } from "@/lib/products";

export const metadata: Metadata = {
  title: "심층 리포트",
  description: "만세력 기반 정확한 계산 + AI 심층 해석. 평생사주·궁합·올해운세·직업재물 리포트",
};

// 가격은 판매량 따라 변하므로 60초 캐시로 재계산
export const revalidate = 60;

export default async function ProductsPage() {
  const pricing = await getPricing();
  const allAtCap = Object.values(pricing.prices).every((p) => p.atCap);

  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <header className="text-center">
        <h1 className="text-2xl font-bold">심층 리포트</h1>
        <p className="mt-2 text-sm text-ink-soft">
          기다리는 곳이 많지만, 오롭미는 <b className="text-accent-strong">1~2분</b>이면 완성돼요.
          <br />
          링크로 평생 보관하고, PDF로도 받아보실 수 있어요.
        </p>
      </header>

      <div className="mt-5">
        <Link
          href="/sample"
          className="flex items-center justify-between rounded-2xl border border-accent bg-accent-soft/40 px-5 py-3.5 transition hover:bg-accent-soft/70"
        >
          <div>
            <p className="text-sm font-bold text-accent-strong">
              📄 결제 전에 샘플 먼저 보기
            </p>
            <p className="mt-0.5 text-xs text-ink-soft">
              리포트 전문을 통째로 공개해요 — 결제 전에 다 읽어보고 결정하세요
            </p>
          </div>
          <span className="text-accent-strong">→</span>
        </Link>
      </div>

      <div className="mt-4">
        <PriceCounter
          paidCount={pricing.paidCount}
          remaining={pricing.remainingToIncrease}
          allAtCap={allAtCap}
        />
      </div>

      <div className="mt-6 space-y-5">
        {Object.values(PRODUCTS).map((p) => {
          const price = pricing.prices[p.code];
          const isBundle = p.code === "bundle";
          return (
            <section
              key={p.code}
              id={p.code}
              className={`rounded-2xl border bg-card p-5 ${
                isBundle ? "border-2 border-accent" : "border-line"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">
                    {p.name}
                    {isBundle && (
                      <span className="ml-1.5 rounded-full bg-accent-strong px-2 py-0.5 align-middle text-[10px] font-bold text-white">
                        가장 알뜰
                      </span>
                    )}
                  </h2>
                  <p className="mt-1 text-sm text-ink-soft">{p.tagline}</p>
                </div>
                <div className="shrink-0 text-right">
                  <PriceTag current={price.current} list={price.list} size="lg" />
                  {isBundle && (
                    <p className="mt-0.5 text-xs text-ink-soft">
                      개별 구매 대비{" "}
                      {(
                        pricing.prices.lifetime.current +
                        pricing.prices.year.current +
                        pricing.prices.career.current -
                        price.current
                      ).toLocaleString()}
                      원 절약
                    </p>
                  )}
                </div>
              </div>
              {/* 비대면 상품은 분량·납기가 유일한 품질 시그널 — 실측값을 전면에 */}
              <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                <span className="rounded-full bg-accent-soft/60 px-2.5 py-1 font-medium text-accent-strong">
                  📄 PDF {p.pdfPages}페이지
                </span>
                <span className="rounded-full bg-accent-soft/60 px-2.5 py-1 font-medium text-accent-strong">
                  ✍️ {p.charCount} 분량
                </span>
                <span className="rounded-full bg-accent-soft/60 px-2.5 py-1 font-medium text-accent-strong">
                  {/* 프리미엄은 4단계로 나눠 써서 더 걸린다 — 실측 기준으로 정직하게 */}
                  ⚡ {p.code === "deep" ? "10분 내 발급" : "1~2분 즉시 발급"}
                </span>
              </div>
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {p.sections.map((s) => (
                  <li key={s} className="rounded-full bg-bg px-2.5 py-1 text-xs text-ink-soft">
                    {s}
                  </li>
                ))}
              </ul>
              <Link
                href={`/checkout/new?product=${p.code}`}
                className="mt-4 block rounded-xl bg-accent-strong px-4 py-3 text-center text-[15px] font-bold text-white transition hover:opacity-90"
              >
                {p.personCount === 2 ? "두 사람 정보 입력하기" : "내 정보 입력하기"}
              </Link>
            </section>
          );
        })}
      </div>

      <ReviewList limit={3} />

      {/* 환불 조건을 각주가 아니라 신뢰 장치로 — 왜 제한되는지 이유까지 붙인다 */}
      <div className="mt-8 rounded-2xl border border-line bg-card p-5 text-center text-xs leading-6 text-ink-soft">
        <p className="text-sm font-bold text-ink">🛡️ 생성 전에는 100% 환불해드려요</p>
        <p className="mt-1.5">
          결제 전에{" "}
          <Link href="/sample" className="text-accent-strong underline">
            샘플로 전문
          </Link>
          을 미리 읽어보실 수 있고, 생성 전이라면 사유 없이 전액 환불해드려요.
          <br />
          다만 리포트가 완성된 뒤에는 맞춤형 디지털 콘텐츠라 청약철회가 제한돼요.{" "}
          <Link href="/refund" className="underline">
            환불정책
          </Link>
        </p>
        <p className="mt-2">리포트는 생성 후 언제든 같은 링크로 다시 볼 수 있어요.</p>
      </div>
    </div>
  );
}

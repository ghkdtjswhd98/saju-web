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
          결제 즉시 나만의 심층 리포트가 완성돼요. 결과는 링크로 영구 보관.
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
              실제 발급된 리포트 전문을 그대로 공개했어요
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
              <ul className="mt-3 flex flex-wrap gap-1.5">
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

      <p className="mt-8 text-center text-xs text-ink-soft">
        리포트는 생성 완료 후 언제든 같은 링크로 다시 볼 수 있어요.
        <br />
        맞춤형 디지털 콘텐츠 특성상 생성 완료 후에는 청약철회(환불)가 제한돼요.{" "}
        <Link href="/refund" className="underline">
          환불정책
        </Link>
      </p>
    </div>
  );
}

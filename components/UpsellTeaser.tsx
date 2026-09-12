// 무료 결과 하단 유료 전환 티저 — 잠긴 섹션 미리보기 + 상품 목록 (서버 컴포넌트)
import Link from "next/link";
import Icon from "@/components/icons";
import { PriceCounter, PriceTag } from "@/components/PriceTag";
import { getPricing } from "@/lib/pricing";
import { PRODUCTS, type ProductCode } from "@/lib/products";

// 유료 리포트에서 실제로 다루는 주제를 "잠긴 상태"로 보여준다 (내용 과장 없이 목차 기반)
const LOCKED_PREVIEWS = [
  { title: "올해의 흐름", hint: "기회가 쏟아지는 시기와 조심할 시기가 언제인지" },
  { title: "속마음 리딩", hint: "겉모습 뒤에 숨겨둔 당신의 가장 내밀한 결" },
  { title: "재물의 그릇", hint: "돈이 들어오는 방식과 새는 패턴" },
  { title: "관계의 패턴", hint: "연애에서 반복되는 끌림과 갈등의 이유" },
];

// love119 벤치마킹(권고 7): 10개 나열은 선택 마비 — 고정 3개만 보여주고 나머지는 /products 링크로.
// 1인 결과엔 2인 입력 상품(love·reunion·crush)을 섞지 않는다 — 입력 정보가 그대로 이어지지 않기 때문.
// 이 컴포넌트는 1인 무료 결과에서만 렌더된다(2인 궁합 결과는 page.tsx의 love 단일 CTA) — 2인 분기는 도달 불가라 제거.
const PICKS: ProductCode[] = ["lifetime", "bundle", "year"];

export default async function UpsellTeaser({ fromShareId }: { fromShareId: string }) {
  const pricing = await getPricing();
  const allAtCap = Object.values(pricing.prices).every((p) => p.atCap);
  const picks = PICKS.map((code) => PRODUCTS[code]);

  return (
    <section className="mt-8">
      {/* 잠긴 섹션 티저 */}
      <div className="space-y-2">
        {LOCKED_PREVIEWS.map((s) => (
          <div
            key={s.title}
            className="relative overflow-hidden rounded-2xl border border-line bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-widest text-ink-soft">{s.title}</h3>
              <Icon name="lock" size={16} className="text-ink-soft" />
            </div>
            <p className="mt-2 select-none text-[15px] leading-7 text-ink-soft blur-[5px]">
              {s.hint}. 그 답은 심층 리포트에서 확인할 수 있어요. 여기엔 당신의 사주에서만
              나오는 구체적인 이야기가 담겨요.
            </p>
            <p className="mt-1 text-xs text-ink-soft">{s.hint} — 심층 리포트에서 열려요</p>
          </div>
        ))}
      </div>

      {/* 상품 선택 */}
      <div className="mt-5 rounded-2xl border-2 border-accent bg-card p-5 text-center">
        <h2 className="text-lg font-bold leading-snug">심층 리포트로 전부 열어보기</h2>
        <p className="mt-1 text-xs text-ink-soft">
          결제 즉시 생성 · 링크로 영구 보관 · 입력 정보 그대로 이어져요
        </p>
        <div className="mt-3">
          <PriceCounter
            paidCount={pricing.paidCount}
            remaining={pricing.remainingToIncrease}
            allAtCap={allAtCap}
          />
        </div>
        <div className="mt-4 space-y-2">
          {picks.map((p) => {
            const price = pricing.prices[p.code];
            const isBundle = p.code === "bundle";
            // '가장 많이 선택' 뱃지는 하단 고정 바와 같은 상품(lifetime)에만 단다
            const recommended = p.code === "lifetime";
            return (
              <Link
                key={p.code}
                href={`/checkout/new?product=${p.code}&from=${fromShareId}`}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition hover:border-accent ${
                  isBundle
                    ? "border-accent bg-accent-soft/40"
                    : recommended
                      ? "border-accent bg-bg"
                      : "border-line bg-bg"
                }`}
              >
                <span>
                  <span className="block text-[15px] font-bold">
                    {p.cardTitle}
                    {isBundle && (
                      <span className="ml-1.5 rounded-full bg-[#FFE9A8] px-2 py-0.5 align-middle text-[10px] font-bold text-[#272132]">
                        가장 알뜰
                      </span>
                    )}
                    {recommended && (
                      <span className="ml-1.5 rounded-full bg-accent-soft px-2 py-0.5 align-middle text-[10px] font-bold text-ink">
                        가장 많이 선택
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-ink-soft">{p.tagline}</span>
                </span>
                <span className="ml-3 shrink-0 text-right">
                  <PriceTag current={price.current} list={price.list} size="sm" />
                </span>
              </Link>
            );
          })}
        </div>
        {/* 나머지 상품은 목록 페이지로 — 3개만 보여주되 선택지를 숨기진 않는다 */}
        <Link href="/products" className="mt-3 inline-block text-sm text-accent-strong underline">
          직업·재물, 결혼, 도화살 등 다른 리포트 보기 →
        </Link>
      </div>
    </section>
  );
}

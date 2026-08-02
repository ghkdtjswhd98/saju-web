import type { Metadata } from "next";
import Link from "next/link";
import { PRODUCTS } from "@/lib/products";

export const metadata: Metadata = {
  title: "심층 리포트",
  description: "만세력 기반 정확한 계산 + AI 심층 해석. 평생사주·궁합·올해운세·직업재물 리포트",
};

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <header className="text-center">
        <h1 className="text-2xl font-bold">심층 리포트</h1>
        <p className="mt-2 text-sm text-ink-soft">
          결제 즉시 AI가 나만의 리포트를 지어드려요. 결과는 링크로 영구 보관.
        </p>
      </header>

      <div className="mt-8 space-y-5">
        {Object.values(PRODUCTS).map((p) => (
          <section key={p.code} id={p.code} className="rounded-2xl border border-line bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{p.name}</h2>
                <p className="mt-1 text-sm text-ink-soft">{p.tagline}</p>
              </div>
              <p className="shrink-0 text-lg font-bold text-accent-strong">
                {p.price.toLocaleString()}원
              </p>
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
        ))}
      </div>

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

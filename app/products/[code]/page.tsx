import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/icons";
import ReviewList from "@/components/ReviewList";
import StickyBuyBar from "@/components/StickyBuyBar";
import { PriceTag } from "@/components/PriceTag";
import { LAUNCH_END } from "@/lib/launch";
import { POSTER_BG } from "@/lib/poster-art";
import { getPricing } from "@/lib/pricing";
import { getProduct } from "@/lib/products";
import { TEASERS } from "@/lib/product-teasers";

// 상품 전용 상세페이지 — 압구정연애박사 벤치마킹(2026-09-02):
// [포스터 히어로] → [훅+가격] → [섹션 티저 카드] → [신뢰 블록] → [후기] → [하단 고정 타임어택 CTA]
// 카운트다운은 진짜다(lib/launch.ts) — 마감 후 pricing이 실제로 정가를 적용한다.
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const product = getProduct(code);
  if (!product) return {};
  return {
    title: product.cardTitle,
    description: `${product.name} — ${product.tagline}. PDF ${product.pdfPages}페이지 · ${product.charCount} 분량.`,
    openGraph: { images: [`/brand/poster/${product.code}`] },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const product = getProduct(code);
  if (!product) notFound();
  const pricing = await getPricing();
  const price = pricing.prices[product.code];
  const teaser = TEASERS[product.code];
  // 티저 카피가 없으면 목차 원본으로 폴백 (배포 순서 안전망)
  const cards =
    teaser?.sections ??
    product.sections.map((s) => ({ key: s, title: s, desc: "" }));

  return (
    <div className="mx-auto max-w-[430px] px-5 pb-32 pt-6">
      {/* 포스터 히어로 — love119 모바일 벤치마킹(권고 1): 로딩 중 흰 빈칸 대신 상품 무드색 자리표시 */}
      {/* eslint-disable-next-line @next/next/no-img-element -- 자체 생성 라우트 */}
      <img
        src={`/brand/poster/${product.code}`}
        alt={product.name}
        width={900}
        height={600}
        style={{ backgroundColor: POSTER_BG[product.code] }}
        className="aspect-[3/2] w-full rounded-2xl border border-line object-cover"
      />

      <header className="mt-5">
        <p className="text-[11px] font-semibold tracking-wide text-accent-strong">{product.name}</p>
        <h1 className="mt-1 text-[22px] font-bold leading-snug">{product.cardTitle}</h1>
        {teaser?.hook && <p className="mt-2 text-[15px] text-ink-soft">{teaser.hook}</p>}
        <p className="mt-3">
          <PriceTag current={price.current} list={price.list} size="lg" />
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
          <span className="rounded-full bg-accent-soft/60 px-2.5 py-1 font-medium text-accent-strong">
            <Icon name="doc" /> PDF {product.pdfPages}페이지
          </span>
          <span className="rounded-full bg-accent-soft/60 px-2.5 py-1 font-medium text-accent-strong">
            <Icon name="pen" /> {product.charCount} 분량
          </span>
          <span className="rounded-full bg-accent-soft/60 px-2.5 py-1 font-medium text-accent-strong">
            <Icon name="bolt" /> {product.code === "deep" ? "15분 내 발급" : "1~2분 즉시 발급"}
          </span>
          <span className="rounded-full bg-accent-soft/60 px-2.5 py-1 font-medium text-accent-strong">
            <Icon name="mail" /> PDF 이메일 자동 발송
          </span>
        </div>
      </header>

      {/* 섹션 티저 카드 — "이 리포트가 답하는 것들" */}
      <section className="mt-8">
        <h2 className="text-lg font-bold">이 리포트가 답하는 것들</h2>
        <div className="mt-4 space-y-3">
          {cards.map((c, i) => (
            <div key={c.key} className="rounded-2xl border border-line bg-card p-4">
              <p className="text-[11px] font-semibold text-accent-strong">
                {String(i + 1).padStart(2, "0")} · {c.key}
              </p>
              <p className="mt-1 text-[15px] font-bold leading-snug">{c.title}</p>
              {c.desc && <p className="mt-1.5 text-sm leading-6 text-ink-soft">{c.desc}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* 신뢰 블록 */}
      <section className="mt-8 rounded-2xl border border-line bg-card p-5">
        <h2 className="text-sm font-bold tracking-widest text-accent-strong">
          왜 오롭미는 팔자가 안 틀릴까요
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-6">
          <li>
            <b>계산은 만세력으로.</b> 팔자·오행·십신은 만세력 데이터 기반 결정론적 알고리즘이
            확정해요. AI는 해석만 담당 — 챗봇 사주의 &quot;팔자부터 틀리는 문제&quot;가 구조적으로
            불가능해요.
          </li>
          <li>
            <b>듣기 좋은 말만 하지 않아요.</b> 강점과 함께 의식하면 좋은 그늘까지 균형 있게.
          </li>
          <li>
            <b>회원가입 없음.</b> 생년월일시만 입력하면 끝. 결과는 링크와 PDF로 영구 보관돼요.
          </li>
        </ul>
        <Link
          href="/sample"
          className="mt-4 block rounded-xl border border-line bg-bg px-4 py-3 text-center text-sm font-bold transition hover:border-accent"
        >
          <Icon name="search" /> 결제 전에 샘플 리포트 전문 먼저 보기
        </Link>
      </section>

      <ReviewList limit={3} />

      <p className="mt-6 text-center text-xs text-ink-soft">
        <Link href="/products" className="text-accent-strong underline">
          ← 다른 리포트 전체 보기
        </Link>
      </p>

      <StickyBuyBar
        code={product.code}
        current={price.current}
        list={price.list}
        launchEndIso={LAUNCH_END.toISOString()}
        twoPerson={product.personCount === 2}
      />
    </div>
  );
}

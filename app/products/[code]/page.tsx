import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/icons";
import ReviewList from "@/components/ReviewList";
import StickyBuyBar from "@/components/StickyBuyBar";
import { PriceTag } from "@/components/PriceTag";
import { LAUNCH_END } from "@/lib/launch";
import { posterMoodGradient } from "@/lib/poster-art";
import { posterArtUrl } from "@/lib/poster-art-file";
import { getPricing } from "@/lib/pricing";
import { getProduct } from "@/lib/products";
import { getReviewSummary } from "@/lib/reviews";

// 상품 상세 v2 — 타이트사주 벤치마킹(2026-09-13, docs/superpowers/specs/2026-09-13-product-detail-v2.md):
// [원화 히어로: 질문 2줄+가격+CTA] → [감성 한 줄 ×2] → [챕터 카드] → [샘플] → [신뢰 스트립(진짜만)] → [후기] → [FAQ] → [고정 CTA]
// 원화(public/poster-art/{code}.jpg|png)가 없는 상품은 무드 그라데이션으로 대신한다. 가짜 참여자 수·수상 배지는 넣지 않는다.
// 카운트다운은 진짜다(lib/launch.ts) — 마감 후 pricing이 실제로 정가를 적용한다.
export const revalidate = 60;

const GOLD = "#FFE9A8";

// 챕터 헤더가 원화 1장을 돌려쓸 때의 크롭 위치 — 카드마다 다른 부분이 보이게 순환한다
const CROP_POSITIONS = ["50% 15%", "20% 45%", "80% 35%", "50% 70%", "30% 25%", "70% 60%"];

// 4각 별 장식 — 감성 문장·챕터 질문 앞에 쓰는 작은 SVG(이모지 금지)
function Sparkle({ size = 12, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={GOLD} aria-hidden="true" className={`inline-block shrink-0 ${className}`}>
      <path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z" />
    </svg>
  );
}

const FAQ: { q: string; a: string }[] = [
  {
    // 입력 폼은 12지지 시각 + '모름'뿐이고 리포트는 시주 부재를 굳이 적지 않는다 — components/LandingFaq.tsx와 같은 검증된 문구
    q: "태어난 시간을 모르면 못 보나요?",
    a: "볼 수 있어요. 시간을 '모름'으로 선택하면 년주·월주·일주 세 기둥을 중심으로 해석해드려요. 시간까지 알면 더 정밀해지지만, 몰라도 충분히 의미 있는 결과가 나와요.",
  },
  {
    q: "결제하면 언제 받을 수 있나요?",
    a: "결제 직후 화면에서 바로 생성이 시작되고, 완료되면 PDF를 이메일로도 보내드려요. 링크는 만료되지 않아 언제든 다시 열 수 있어요.",
  },
  {
    q: "읽어보고 별로면 환불되나요?",
    a: "생성이 실패하면 자동으로 환불돼요. 다 받아보신 뒤에도 만족스럽지 않으면 어떤 점이 부족했는지 알려주시면 환불해드려요.",
  },
];

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
  const [pricing, reviews] = await Promise.all([getPricing(), getReviewSummary(3)]);
  const price = pricing.prices[product.code];
  const art = posterArtUrl(product.code);
  const mood = posterMoodGradient(product.code);
  const twoPerson = product.personCount === 2;
  const ctaLabel = twoPerson ? "두 사람 정보 입력하기" : "내 정보 입력하기";
  const issueTime = product.code === "deep" ? "15분 내 발급" : "1~2분 즉시 발급";
  // ReviewList와 같은 임계(3건 미만 숨김) — 스트립에 "후기 1건"이 뜨면 무실적 인증이 된다
  const showReviews = reviews.count >= 3;

  return (
    <div className="mx-auto max-w-[430px] pb-32">
      {/* 1. 히어로 — 원화 전면(~62vh) 위 하단 그라데이션, 글은 아래쪽에 모아 원화의 여백(아래)을 쓴다 */}
      <section className="relative h-[62vh] max-h-[620px] min-h-[460px] overflow-hidden" style={{ background: mood }}>
        {art ? (
          // eslint-disable-next-line @next/next/no-img-element -- 정적 원화, 첫 화면이라 lazy 없이
          <img
            src={art}
            alt={product.name}
            width={1024}
            height={1280}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: "50% 20%" }}
          />
        ) : (
          // 원화가 아직 없을 때 — 세로 포스터의 초승달·별 장식만 옮겨 빈 무드 배경을 채운다
          <svg viewBox="0 0 430 560" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
            <circle cx="56" cy="104" r="2.6" fill="#CFC4E8" opacity="0.8" />
            <circle cx="160" cy="58" r="1.8" fill="#CFC4E8" opacity="0.6" />
            <circle cx="266" cy="176" r="1.6" fill="#F2EEF9" opacity="0.7" />
            <circle cx="386" cy="220" r="2.2" fill="#B9A9DD" opacity="0.8" />
            <circle cx="80" cy="338" r="2" fill="#B9A9DD" opacity="0.6" />
            <circle cx="215" cy="250" r="132" fill="none" stroke={GOLD} strokeOpacity="0.22" strokeWidth="1.2" />
            <circle cx="215" cy="250" r="96" fill="none" stroke={GOLD} strokeOpacity="0.12" strokeWidth="1.2" strokeDasharray="4 9" />
            <path d="M310 96 a36 36 0 1 0 19 64 a28 28 0 1 1 -19 -64 Z" fill={GOLD} opacity="0.95" />
            <path d="M215 150 l8 24 l24 8 l-24 8 l-8 24 l-8 -24 l-24 -8 l24 -8 z" fill={GOLD} opacity="0.9" />
          </svg>
        )}
        <div className="absolute inset-x-0 bottom-0 h-[72%] bg-gradient-to-t from-[#272132] via-[#272132]/85 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 px-5 pb-7">
          <p className="text-[12px] font-semibold tracking-[0.2em] text-[#FFE9A8]">{product.shortName}</p>
          <h1 className="mt-2 whitespace-pre-line text-[30px] font-bold leading-[1.28] tracking-[-0.3px] text-[#FAF7F2]">
            {product.heroQuestion}
          </h1>
          <p className="mt-4">
            <PriceTag current={price.current} list={price.list} size="lg" tone="gold" />
          </p>
          <Link
            href={`/checkout/new?product=${product.code}`}
            className="mt-4 block rounded-xl bg-[#FFE9A8] px-4 py-3.5 text-center text-[16px] font-bold text-[#272132] transition hover:opacity-90"
          >
            {ctaLabel}
          </Link>
          <p className="mt-3 text-center text-xs text-ink-soft">
            <Icon name="bolt" /> {issueTime} · <Icon name="doc" /> PDF {product.pdfPages}페이지 · 이메일로도 보내드려요
          </p>
        </div>
      </section>

      {/* 2. 감성 한 줄 ×2 — 그림 없이 타이포와 별 장식만 */}
      <section className="px-5 pt-12 text-center">
        {product.moments.map((m, i) => (
          <div key={m} className={i === 0 ? "" : "mt-10"}>
            <div className="flex items-center justify-center gap-3" aria-hidden="true">
              <span className="h-px w-10 bg-line" />
              <Sparkle size={i === 0 ? 14 : 11} />
              <span className="h-px w-10 bg-line" />
            </div>
            <p className="mt-4 text-[19px] font-semibold leading-relaxed text-[#FAF7F2]">{m}</p>
          </div>
        ))}
      </section>

      {/* 3. 챕터 카드 — sections를 챕터로, 헤더는 무드 그라데이션 + 원화 크롭(있을 때) */}
      <section className="px-5 pt-14">
        <h2 className="text-[20px] font-bold">이 리포트가 답하는 것들</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {product.chapters.length}개 챕터 · PDF {product.pdfPages}페이지 · {product.charCount}
        </p>
        <div className="mt-5 space-y-5">
          {product.chapters.map((ch, i) => (
            <article key={ch.title} className="overflow-hidden rounded-2xl border border-line bg-card">
              <div className="relative h-24" style={{ background: mood }}>
                {art && (
                  // eslint-disable-next-line @next/next/no-img-element -- 히어로와 같은 원화를 위치만 바꿔 재사용
                  <img
                    src={art}
                    alt=""
                    width={1024}
                    height={1280}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                    style={{ objectPosition: CROP_POSITIONS[i % CROP_POSITIONS.length] }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#322a42] via-[#322a42]/50 to-transparent" />
                <p className="absolute bottom-3 left-4 text-[11px] font-semibold tracking-[0.2em] text-[#FFE9A8]">
                  CHAPTER {String(i + 1).padStart(2, "0")}
                </p>
              </div>
              <div className="p-4 pt-3">
                <h3 className="text-[16px] font-bold">{ch.title}</h3>
                <ul className="mt-2.5 space-y-1.5">
                  {ch.questions.map((q) => (
                    <li key={q} className="flex items-start gap-2 text-sm leading-6 text-ink-soft">
                      <Sparkle size={10} className="mt-2" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 4. 샘플 미리보기 */}
      <section className="px-5 pt-8">
        <Link
          href="/sample"
          className="block rounded-2xl border border-line bg-card px-5 py-4 text-center text-sm font-bold transition hover:border-accent"
        >
          <Icon name="search" /> 결제 전에 샘플 리포트 전문 먼저 보기
        </Link>
      </section>

      {/* 5. 신뢰 스트립 — 진짜만: 만세력 계산·PDF 실측·자동 환불·실후기(3건 이상일 때만) */}
      <section className="px-5 pt-8">
        <div className={`grid gap-3 rounded-2xl border border-line bg-card px-3 py-5 ${showReviews ? "grid-cols-4" : "grid-cols-3"}`}>
          <div className="flex flex-col items-center gap-2 text-center">
            <Icon name="moon" size={22} className="text-[#FFE9A8]" />
            <p className="text-xs font-bold leading-4">만세력 계산</p>
            <p className="text-[11px] leading-[15px] text-ink-soft">팔자는 계산,<br />AI는 해석만</p>
          </div>
          <div className="flex flex-col items-center gap-2 border-l border-line text-center">
            <Icon name="doc" size={22} className="text-[#FFE9A8]" />
            <p className="text-xs font-bold leading-4">PDF {product.pdfPages}p</p>
            <p className="text-[11px] leading-[15px] text-ink-soft">실측 분량<br />{product.charCount}</p>
          </div>
          <div className="flex flex-col items-center gap-2 border-l border-line text-center">
            <Icon name="shield" size={22} className="text-[#FFE9A8]" />
            <p className="text-xs font-bold leading-4">자동 환불</p>
            <p className="text-[11px] leading-[15px] text-ink-soft">생성 실패 시<br />바로 환불</p>
          </div>
          {showReviews && (
            <div className="flex flex-col items-center gap-2 border-l border-line text-center">
              <Icon name="heart" size={22} className="text-[#FFE9A8]" />
              <p className="text-xs font-bold leading-4">실후기 {reviews.count.toLocaleString()}건</p>
              <p className="text-[11px] leading-[15px] text-ink-soft">받은 분만<br />남길 수 있어요</p>
            </div>
          )}
        </div>
      </section>

      <div className="px-5">
        <ReviewList limit={3} summary={reviews} />
      </div>

      {/* FAQ — 상품 공통 3개 */}
      <section className="px-5 pt-10">
        <h2 className="text-[18px] font-bold">자주 묻는 질문</h2>
        <div className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card px-4">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-3.5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-semibold">
                {f.q}
                <span className="shrink-0 text-ink-soft transition group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-3 text-right text-xs">
          <Link href="/refund" className="text-ink-soft underline">환불정책 전문</Link>
        </p>
      </section>

      <p className="mt-8 text-center text-xs text-ink-soft">
        <Link href="/products" className="text-accent-strong underline">
          ← 다른 리포트 전체 보기
        </Link>
      </p>

      <StickyBuyBar
        code={product.code}
        current={price.current}
        list={price.list}
        launchEndIso={LAUNCH_END.toISOString()}
        twoPerson={twoPerson}
      />
    </div>
  );
}

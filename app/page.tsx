import Link from "next/link";
import FreeForm from "@/components/FreeForm";
import LandingFaq from "@/components/LandingFaq";
import Orobi from "@/components/Orobi";
import ReviewList from "@/components/ReviewList";
import { PriceTag } from "@/components/PriceTag";
import { getPricing } from "@/lib/pricing";
import { PRODUCTS } from "@/lib/products";

// 단계 가격 반영을 위해 60초 캐시
export const revalidate = 60;

type Pricing = Awaited<ReturnType<typeof getPricing>>;

// 포스터형 상품 섹션 — 이미지가 카드의 얼굴 (썸네일은 /brand/poster에서 자체 생성)
function ProductPosterSection({
  title, subtitle, codes, pricing,
}: {
  title: string; subtitle: string; codes: (keyof typeof PRODUCTS)[]; pricing: Pricing;
}) {
  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {codes.map((code) => {
          const p = PRODUCTS[code];
          return (
            <Link
              key={p.code}
              href={`/products#${p.code}`}
              className="group overflow-hidden rounded-2xl border border-line bg-card transition hover:border-accent"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- 자체 생성 라우트라 최적화 불필요 */}
              <img
                src={`/brand/poster?product=${p.code}`}
                alt={p.name}
                width={900}
                height={600}
                loading="lazy"
                className="aspect-[3/2] w-full object-cover transition group-hover:scale-[1.02]"
              />
              <div className="p-4">
                <p className="text-[11px] font-semibold tracking-wide text-accent-strong">
                  {p.name}
                </p>
                <p className="mt-1 text-[15px] font-bold leading-tight">{p.cardTitle}</p>
                <p className="mt-2">
                  <PriceTag
                    current={pricing.prices[p.code].current}
                    list={pricing.prices[p.code].list}
                    size="sm"
                  />
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default async function Home() {
  const pricing = await getPricing();
  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <section className="text-center">
        <div className="flex justify-center">
          <Orobi size={104} />
        </div>
        <p className="mt-3 text-sm font-medium text-accent-strong">
          회원가입 없이 30초 · 만세력 기반
        </p>
        <h1 className="mt-2 text-[26px] font-bold leading-snug tracking-tight">
          계산은 만세력으로 정확하게,
          <br />
          해석은 AI로 깊이 있게
        </h1>
        <p className="mt-3 text-[15px] text-ink-soft">
          AI 사주의 고질병인 팔자 계산 오류가 없어요.
          <br />
          팔자는 만세력 데이터로 계산하고, AI는 해석만 담당하니까요.
        </p>
      </section>

      <section className="mt-8">
        <FreeForm />
      </section>

      <section className="mt-5">
        <Link
          href="/test/ohaeng"
          className="flex items-center justify-between rounded-2xl border border-line bg-card px-5 py-4 transition hover:border-accent"
        >
          <div>
            <p className="text-[15px] font-bold">🌱🔥⛰️💎🌊 오행 캐릭터 테스트</p>
            <p className="mt-0.5 text-xs text-ink-soft">
              생년월일 몰라도 OK — 12문항 1분이면 내 기운이 나와요
            </p>
          </div>
          <span className="text-lg text-accent-strong">→</span>
        </Link>
      </section>

      {/* 상품 포스터 그리드 — 압구정연애박사 벤치마킹(2026-08-30) 포스터 공식:
          [무드 이미지] + [카테고리] + [질문형 제목] + [가격]. 섹션은 BEST/연애 2분할. */}
      <ProductPosterSection
        title="오롭미 BEST 사주"
        subtitle="방금 본 무료는 요약이에요 — 재물·직업·인생의 흐름은 따로 있어요"
        codes={["deep", "bundle", "lifetime", "year", "career"]}
        pricing={pricing}
      />
      <ProductPosterSection
        title="연애가 고민이라면"
        subtitle="재회부터 결혼까지, 두 사람의 사주가 말해주는 것"
        codes={["reunion", "crush", "love", "marriage", "dohwa"]}
        pricing={pricing}
      />

      <section className="mt-12 rounded-2xl border border-line bg-card p-5">
        <h2 className="text-sm font-bold tracking-widest text-accent-strong">
          챗봇 사주는 왜 팔자부터 틀릴까요
        </h2>
        <ul className="mt-3 space-y-2.5 text-sm leading-6">
          <li>
            <b>정확한 팔자.</b> AI에게 계산을 맡기면 사주팔자 자체가 틀리는 경우가 많아요. 오롭미는
            만세력 데이터 기반 알고리즘으로 팔자·오행·십신을 확정한 뒤, AI는 해석만 해요.
          </li>
          <li>
            <b>듣기 좋은 말만 하지 않아요.</b> 강점과 함께 의식하면 좋은 그늘까지, 균형 있게 짚어요.
          </li>
          <li>
            <b>회원가입 없음.</b> 생년월일시만 있으면 30초. 결과는 링크로 저장돼요.
          </li>
        </ul>
      </section>

      <section className="mt-12 rounded-2xl border border-line bg-card p-5">
        <h2 className="text-sm font-bold tracking-widest text-accent-strong">어떻게 계산하나요</h2>
        <ol className="mt-3 space-y-2.5 text-sm leading-6">
          <li>
            <b>1. 만세력 대조.</b> 입력한 생년월일시를 만세력 데이터(1900~2050년, 절기·음력 변환 포함)와
            대조해 사주팔자 여덟 글자를 확정해요.
          </li>
          <li>
            <b>2. 명리 요소 계산.</b> 일간을 기준으로 오행 분포(지장간 가중치 반영), 십신, 신살을
            결정론적 알고리즘으로 계산해요. 같은 생년월일시면 언제나 같은 결과가 나와요.
          </li>
          <li>
            <b>3. AI 해석.</b> 확정된 계산값만을 근거로 AI가 해석문을 지어요. AI는 계산에 관여할 수
            없어서, 챗봇 사주에서 흔한 &quot;팔자 자체가 틀리는 문제&quot;가 구조적으로 불가능해요.
          </li>
        </ol>
        <p className="mt-3 text-xs text-ink-soft">
          결과 페이지의 &quot;사주팔자&quot; 표를 다른 만세력 서비스와 대조해보셔도 좋아요 — 같은 값이 나와요.
        </p>
      </section>

      <ReviewList limit={4} />

      <LandingFaq />
    </div>
  );
}

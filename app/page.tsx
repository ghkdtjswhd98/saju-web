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

export default async function Home() {
  const pricing = await getPricing();
  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <section className="text-center">
        <div className="flex justify-center">
          <Orobi size={104} />
        </div>
        <p className="mt-3 text-sm font-medium text-accent-strong">회원가입 없는 무료 AI 사주</p>
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

      <section className="mt-12">
        <h2 className="text-center text-lg font-bold">더 깊이 알고 싶다면</h2>
        <p className="mt-1 text-center text-sm text-ink-soft">무료 결과가 마음에 들면, 심층 리포트로 이어가세요.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {Object.values(PRODUCTS).map((p) => (
            <Link
              key={p.code}
              href={`/products#${p.code}`}
              className="rounded-2xl border border-line bg-card p-4 transition hover:border-accent"
            >
              <p className="text-[15px] font-bold leading-tight">{p.name}</p>
              <p className="mt-1.5 line-clamp-2 text-xs text-ink-soft">{p.tagline}</p>
              <p className="mt-2">
                <PriceTag
                  current={pricing.prices[p.code].current}
                  list={pricing.prices[p.code].list}
                  size="sm"
                />
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-line bg-card p-5">
        <h2 className="text-sm font-bold tracking-widest text-accent-strong">오롭미가 다른 이유</h2>
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

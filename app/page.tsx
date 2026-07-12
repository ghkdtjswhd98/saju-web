import Link from "next/link";
import FreeForm from "@/components/FreeForm";
import { PRODUCTS } from "@/lib/products";

export default function Home() {
  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <section className="text-center">
        <p className="text-sm font-medium text-accent-strong">회원가입 없는 무료 AI 사주</p>
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
              <p className="mt-2 text-sm font-bold text-accent-strong">
                {p.price.toLocaleString()}원
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
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { ElementChart, PillarTable, StarProfile } from "@/components/SajuCards";
import { getDb, reports } from "@/lib/db";
import { getPricing } from "@/lib/pricing";
import { getProduct } from "@/lib/products";
import { FORMATS } from "@/lib/prompts/formats";
import type { PersonInput, SajuResult } from "@/lib/saju/types";

// 공개 샘플 리포트 — "돈 내면 뭘 받는지"를 결제 전에 그대로 보여준다.
// 당근 채팅에서 이 링크 하나로 설득이 끝나는 게 목적.
export const metadata: Metadata = {
  title: "리포트 샘플 — 이런 걸 받아요",
  description:
    "오롭미 평생사주 종합 리포트 실제 예시. 기질·재물·직업·연애·건강과 나이별 인생 흐름까지 전문 공개.",
};

export const revalidate = 300;

const SAMPLE_TOKEN = process.env.SAMPLE_REPORT_TOKEN ?? "";

export default async function SamplePage() {
  const rows = SAMPLE_TOKEN
    ? await getDb().select().from(reports).where(eq(reports.token, SAMPLE_TOKEN)).limit(1)
    : [];
  const report = rows[0];
  const pricing = await getPricing();
  const price = pricing.prices.lifetime;

  const blocks = (report?.content as { blocks?: Record<string, string> } | null)?.blocks ?? {};
  const order = FORMATS[report?.productCode ?? "lifetime"]?.markers.map((m) => m.key) ?? [];
  const saju = report ? (report.sajuData as SajuResult) : null;
  const persons = report ? (report.inputData as { persons: PersonInput[] }).persons : null;
  const productName = getProduct(report?.productCode ?? "lifetime")?.name ?? "평생사주 종합 리포트";

  return (
    <div className="mx-auto max-w-xl px-5 py-8">
      <header className="text-center">
        <p className="text-xs tracking-widest text-accent-strong">리포트 샘플</p>
        <h1 className="mt-2 text-2xl font-bold leading-snug">
          결제 전에 먼저 보세요
          <br />
          이런 걸 받으시게 돼요
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          아래는 실제 발급된 {productName}의 전문이에요.
          <br />
          (가상 인물 예시 · 개인정보 없음)
        </p>
      </header>

      {report?.status === "done" && saju && persons ? (
        <>
          <div className="mt-7 space-y-4">
            <PillarTable saju={saju} />
            <StarProfile saju={saju} />
            <ElementChart saju={saju} />
            {saju.daewoon && (
              <div className="rounded-2xl border border-line bg-card p-5">
                <h3 className="text-sm font-bold tracking-widest text-accent-strong">
                  인생 국면(대운) 시간표
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  {saju.daewoon.pillars.map((d) => (
                    <div key={d.startAge} className="flex justify-between">
                      <span className="text-ink-soft">
                        {d.startAge}~{d.endAge}세
                      </span>
                      <span className="font-medium">{d.hangul}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-ink-soft">
                  10년 단위로 바뀌는 인생의 국면이에요. 리포트에서는 각 시기가 어떤 흐름인지 풀어서
                  설명해드려요.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-4">
            {order.map((key) => {
              const body = blocks[key];
              if (!body?.trim()) return null;
              return (
                <div key={key} className="rounded-2xl border border-line bg-card p-5">
                  <h3 className="mb-2 text-sm font-bold tracking-widest text-accent-strong">{key}</h3>
                  <p className="whitespace-pre-wrap text-[15px] leading-7">{body.trim()}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-line bg-card p-5 text-center">
            <p className="text-sm text-ink-soft">이 리포트는 PDF로도 받아보실 수 있어요</p>
            <a
              href={`/report/${SAMPLE_TOKEN}/pdf`}
              className="mt-3 inline-block rounded-xl border border-line px-4 py-2.5 text-sm font-bold transition hover:border-accent"
            >
              📄 샘플 PDF 열어보기
            </a>
          </div>
        </>
      ) : (
        <p className="mt-8 rounded-2xl border border-line bg-card p-6 text-center text-sm text-ink-soft">
          샘플을 준비하고 있어요. 잠시 후 다시 확인해주세요.
        </p>
      )}

      <section className="mt-8 rounded-2xl border-2 border-accent bg-card p-5 text-center">
        <h2 className="text-lg font-bold leading-snug">
          이제 &lsquo;내 사주&rsquo;로
          <br />
          받아볼 차례예요
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          팔자는 만세력 데이터로 정확히 계산하고,
          <br />
          해석만 깊이 있게 풀어드려요. 결제 즉시 완성.
        </p>
        <Link
          href="/checkout/new?product=lifetime"
          className="mt-4 block rounded-xl bg-accent-strong px-4 py-3.5 text-[15px] font-bold text-white transition hover:opacity-90"
        >
          내 리포트 받기 — {price.current.toLocaleString()}원
        </Link>
        <Link href="/" className="mt-3 block text-sm text-accent-strong hover:underline">
          먼저 무료로 맛보기 →
        </Link>
      </section>
    </div>
  );
}

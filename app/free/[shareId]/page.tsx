import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, reports } from "@/lib/db";
import { ElementChart, PillarTable, StarProfile } from "@/components/SajuCards";
import ShareBar from "@/components/ShareBar";
import StreamingReport from "@/components/StreamingReport";
import UpsellTeaser from "@/components/UpsellTeaser";
import { computeChemistry } from "@/lib/saju/chemistry";
import { ILGAN_MAP, STEM_TO_KEY } from "@/lib/ilgan-content";
import { getPricing } from "@/lib/pricing";
import type { PersonInput, SajuResult } from "@/lib/saju/types";

export const dynamic = "force-dynamic";

async function getReport(shareId: string) {
  const db = getDb();
  const rows = await db.select().from(reports).where(eq(reports.token, shareId)).limit(1);
  const r = rows[0];
  if (!r || !r.productCode.startsWith("free")) return null;
  return r;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareId: string }>;
}): Promise<Metadata> {
  const { shareId } = await params;
  const report = await getReport(shareId);
  if (!report) return {};
  const persons = (report.inputData as { persons: PersonInput[] }).persons;
  const blocks = (report.content as { blocks?: Record<string, string> } | null)?.blocks;
  const summary = blocks?.["한줄요약"];
  const isLove = report.productCode === "free_love";

  const title = isLove
    ? `${persons[0].name} ♥ ${persons[1].name} 궁합 — ${summary ?? "무료 케미 결과"}`
    : `${persons[0].name}님의 사주 — ${summary ?? "무료 사주 결과"}`;
  return {
    title,
    description: summary
      ? `"${summary}" — 오롭미 무료 ${isLove ? "궁합" : "사주"}. 나도 확인해보기`
      : "회원가입 없이 30초, 만세력 기반 무료 AI 사주",
    // 실명+생년월일이 담긴 개인 결과 페이지 — 검색 색인 금지 (공유 링크로만 접근)
    robots: { index: false },
  };
}

function ChemistryCard({ sajus, persons }: { sajus: SajuResult[]; persons: PersonInput[] }) {
  const chem = computeChemistry(sajus[0], sajus[1]);
  return (
    <div className="rounded-2xl border-2 border-accent bg-card p-6 text-center">
      <p className="text-xs tracking-widest text-accent-strong">케미 지수</p>
      <p className="mt-1 text-5xl font-bold text-accent-strong">{chem.score}</p>
      <p className="mt-2 text-sm text-ink-soft">
        {persons[0].name} ♥ {persons[1].name}
      </p>
      <div className="mt-3 flex justify-center gap-4 text-xs text-ink-soft">
        <span>서로 끌어당기는 고리 {chem.crossHap}개</span>
        <span>부딪히는 지점 {chem.crossChung}개</span>
        {chem.complement > 0 && <span>채워주는 기운 {chem.complement}축</span>}
      </div>
      <p className="mt-3 text-[11px] text-ink-soft">
        두 사주의 지지 관계(합·충)와 오행 보완도로 계산한 결정론적 점수예요.
      </p>
    </div>
  );
}

export default async function FreeResultPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const report = await getReport(shareId);
  if (!report) notFound();

  const persons = (report.inputData as { persons: PersonInput[] }).persons;
  const content = report.content as { rawText?: string } | null;
  const isLove = report.productCode === "free_love";
  const sajus: SajuResult[] = isLove
    ? (report.sajuData as SajuResult[])
    : [report.sajuData as SajuResult];
  const pricing = await getPricing();
  const lovePrice = pricing.prices.love.current;
  const minPrice = Math.min(
    pricing.prices.lifetime.current,
    pricing.prices.year.current,
    pricing.prices.career.current,
  );

  return (
    <div className="mx-auto max-w-xl px-5 py-8">
      <header className="text-center">
        <p className="text-xs tracking-widest text-ink-soft">
          {isLove ? "무료 궁합 케미" : "무료 사주 결과"}
        </p>
        <h1 className="mt-1 text-xl font-bold">
          {isLove ? `${persons[0].name} ♥ ${persons[1].name}` : `${persons[0].name}님의 사주`}
        </h1>
      </header>

      <div className="mt-6 space-y-4">
        {isLove ? (
          <>
            <ChemistryCard sajus={sajus} persons={persons} />
            {sajus.map((saju, i) => (
              <details key={i} className="group">
                <summary className="cursor-pointer list-none">
                  <div className="mb-2 flex items-center justify-between rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-bold">
                    <span>{persons[i].name}의 사주 데이터</span>
                    <span className="text-xs font-normal text-ink-soft group-open:hidden">펼치기</span>
                  </div>
                </summary>
                <div className="space-y-4 pb-2">
                  <PillarTable saju={saju} />
                  <ElementChart saju={saju} />
                </div>
              </details>
            ))}
          </>
        ) : (
          <>
            <PillarTable saju={sajus[0]} />
            <StarProfile saju={sajus[0]} />
            <ElementChart saju={sajus[0]} />
            {(() => {
              const ilganKey = STEM_TO_KEY[sajus[0].dayMaster.char];
              const ilgan = ilganKey ? ILGAN_MAP[ilganKey] : null;
              return ilgan ? (
                <Link
                  href={`/ilgan/${ilgan.key}`}
                  className="flex items-center justify-between rounded-2xl border border-line bg-card px-5 py-3.5 text-sm transition hover:border-accent"
                >
                  <span>
                    {ilgan.emoji} 내 일간 <b>{ilgan.korean}({ilgan.hanja})</b>은 어떤 사람일까?
                  </span>
                  <span className="text-accent-strong">→</span>
                </Link>
              ) : null;
            })()}
          </>
        )}

        <StreamingReport
          token={shareId}
          initialStatus={report.status}
          initialRawText={content?.rawText ?? null}
        />
      </div>

      <div className="mt-5">
        <ShareBar
          path={`/free/${shareId}`}
          title={
            isLove
              ? `${persons[0].name} ♥ ${persons[1].name} 궁합 케미`
              : `${persons[0].name}님의 사주 결과`
          }
          description={
            isLove
              ? "우리 케미 몇 점인지 확인해봐 — 오롭미 무료 궁합"
              : "회원가입 없이 30초, 만세력 기반 무료 AI 사주 — 오롭미"
          }
        />
      </div>

      {/* 업셀 */}
      {isLove ? (
        <section className="mt-8 rounded-2xl border-2 border-accent bg-card p-5 text-center">
          <p className="text-sm text-ink-soft">여기까지는 맛보기예요</p>
          <h2 className="mt-1 text-lg font-bold leading-snug">
            서로의 연애 스타일, 갈등의 이유,
            <br />
            관계가 깊어지는 법까지
          </h2>
          <Link
            href={`/checkout/new?product=love&from=${shareId}`}
            className="mt-4 block rounded-xl bg-accent-strong px-4 py-3.5 text-[15px] font-bold text-white transition hover:opacity-90"
          >
            심층 궁합 리포트 열기 — {lovePrice.toLocaleString()}원
          </Link>
          <p className="mt-2 text-xs text-ink-soft">6개 섹션 · 결제 즉시 생성 · 링크로 영구 보관</p>
        </section>
      ) : (
        <>
          <div className="text-center mt-8">
            <p className="text-sm text-ink-soft">여기까지는 맛보기예요 — 아래 주제들이 잠겨 있어요</p>
          </div>
          <UpsellTeaser fromShareId={shareId} />
        </>
      )}

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-accent-strong hover:underline">
          나도 무료로 보기 →
        </Link>
      </div>

      {/* 모바일 하단 고정 CTA */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-5 py-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-ink-soft">
              {isLove ? "두 사람 정보 그대로 이어서" : `${persons[0].name}님 사주로 이어서`}
            </p>
            <p className="text-sm font-bold">
              {isLove
                ? `심층 궁합 ${lovePrice.toLocaleString()}원`
                : `심층 리포트 ${minPrice.toLocaleString()}원~`}
            </p>
          </div>
          <Link
            href={`/checkout/new?product=${isLove ? "love" : "lifetime"}&from=${shareId}`}
            className="shrink-0 rounded-xl bg-accent-strong px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
          >
            전부 열어보기
          </Link>
        </div>
      </div>
      {/* 고정 바에 가리지 않도록 여백 */}
      <div className="h-20" />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, reports } from "@/lib/db";
import { ElementChart, PillarTable, StarProfile } from "@/components/SajuCards";
import ShareBar from "@/components/ShareBar";
import StreamingReport from "@/components/StreamingReport";
import { PRODUCTS } from "@/lib/products";
import type { PersonInput, SajuResult } from "@/lib/saju/types";

export const dynamic = "force-dynamic";

async function getReport(shareId: string) {
  const db = getDb();
  const rows = await db.select().from(reports).where(eq(reports.token, shareId)).limit(1);
  const r = rows[0];
  if (!r || r.productCode !== "free") return null;
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
  const person = (report.inputData as { persons: PersonInput[] }).persons[0];
  const blocks = (report.content as { blocks?: Record<string, string> } | null)?.blocks;
  const summary = blocks?.["한줄요약"];
  return {
    title: `${person.name}님의 사주 — ${summary ?? "무료 사주 결과"}`,
    description: summary
      ? `"${summary}" — 오롭미에서 확인한 ${person.name}님의 사주. 나도 무료로 확인해보기`
      : "회원가입 없이 30초, 만세력 기반 무료 AI 사주",
  };
}

export default async function FreeResultPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const report = await getReport(shareId);
  if (!report) notFound();

  const person = (report.inputData as { persons: PersonInput[] }).persons[0];
  const saju = report.sajuData as SajuResult;
  const content = report.content as { rawText?: string } | null;

  return (
    <div className="mx-auto max-w-xl px-5 py-8">
      <header className="text-center">
        <p className="text-xs tracking-widest text-ink-soft">무료 사주 결과</p>
        <h1 className="mt-1 text-xl font-bold">{person.name}님의 사주</h1>
      </header>

      <div className="mt-6 space-y-4">
        <PillarTable saju={saju} />
        <StarProfile saju={saju} />
        <ElementChart saju={saju} />
        <StreamingReport
          token={shareId}
          initialStatus={report.status}
          initialRawText={content?.rawText ?? null}
        />
      </div>

      <div className="mt-5">
        <ShareBar
          path={`/free/${shareId}`}
          title={`${person.name}님의 사주 결과`}
          description="회원가입 없이 30초, 만세력 기반 무료 AI 사주 — 오롭미"
        />
      </div>

      {/* 업셀 CTA */}
      <section className="mt-8 rounded-2xl border-2 border-accent bg-card p-5 text-center">
        <p className="text-sm text-ink-soft">여기까지는 맛보기예요</p>
        <h2 className="mt-1 text-lg font-bold leading-snug">
          운세의 흐름, 속마음, 조심할 것까지
          <br />
          심층 리포트에서 전부 열어보세요
        </h2>
        <div className="mt-4 space-y-2">
          {Object.values(PRODUCTS).map((p) => (
            <Link
              key={p.code}
              href={`/checkout/new?product=${p.code}&from=${shareId}`}
              className="flex items-center justify-between rounded-xl border border-line bg-bg px-4 py-3 text-left transition hover:border-accent"
            >
              <span>
                <span className="block text-[15px] font-bold">{p.name}</span>
                <span className="block text-xs text-ink-soft">{p.tagline}</span>
              </span>
              <span className="ml-3 shrink-0 text-sm font-bold text-accent-strong">
                {p.price.toLocaleString()}원
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-accent-strong hover:underline">
          나도 무료로 사주 보기 →
        </Link>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, reports } from "@/lib/db";
import { ElementChart, PillarTable, StarProfile } from "@/components/SajuCards";
import ShareBar from "@/components/ShareBar";
import StreamingReport from "@/components/StreamingReport";
import UpsellTeaser from "@/components/UpsellTeaser";
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
    // 실명+생년월일이 담긴 개인 결과 페이지 — 검색 색인 금지 (공유 링크로만 접근)
    robots: { index: false },
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

      {/* 업셀: 잠긴 섹션 티저 + 상품 목록 */}
      <div className="text-center mt-8">
        <p className="text-sm text-ink-soft">여기까지는 맛보기예요 — 아래 주제들이 잠겨 있어요</p>
      </div>
      <UpsellTeaser fromShareId={shareId} />

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-accent-strong hover:underline">
          나도 무료로 사주 보기 →
        </Link>
      </div>

      {/* 모바일 하단 고정 CTA */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-5 py-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-ink-soft">{person.name}님 사주로 이어서</p>
            <p className="text-sm font-bold">심층 리포트 9,900원~</p>
          </div>
          <Link
            href={`/checkout/new?product=lifetime&from=${shareId}`}
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

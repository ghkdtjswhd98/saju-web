import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ElementChart, PillarTable, StarProfile } from "@/components/SajuCards";
import AskReport from "@/components/AskReport";
import Icon from "@/components/icons";
import PredictionScore from "@/components/PredictionScore";
import ReviewForm from "@/components/ReviewForm";
import StreamingReport from "@/components/StreamingReport";
import { getDb, reports } from "@/lib/db";
import { getProduct } from "@/lib/products";
import { getReviewByToken } from "@/lib/reviews";
import type { PersonInput, SajuResult } from "@/lib/saju/types";

export const dynamic = "force-dynamic";

async function getReport(token: string) {
  const rows = await getDb().select().from(reports).where(eq(reports.token, token)).limit(1);
  const r = rows[0];
  if (!r || r.productCode.startsWith("free")) return null; // 무료는 /free 경로 사용
  return r;
}

// 같은 주문(번들)의 다른 리포트들
async function getSiblings(orderId: string | null, currentToken: string) {
  if (!orderId) return [];
  const rows = await getDb()
    .select({ token: reports.token, productCode: reports.productCode })
    .from(reports)
    .where(eq(reports.orderId, orderId));
  return rows.filter((r) => r.token !== currentToken);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const report = await getReport(token);
  if (!report) return {};
  const product = getProduct(report.productCode);
  return {
    title: product?.name ?? "심층 리포트",
    robots: { index: false }, // 개인 리포트는 검색 노출 금지
  };
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const report = await getReport(token);
  if (!report) notFound();
  const [siblings, existingReview] = await Promise.all([
    getSiblings(report.orderId, token),
    getReviewByToken(token),
  ]);

  const product = getProduct(report.productCode);
  const persons = (report.inputData as { persons: PersonInput[] }).persons;
  const content = report.content as { rawText?: string } | null;
  const isLove = report.productCode === "love";
  const sajuList: { person: PersonInput; saju: SajuResult }[] = isLove
    ? (report.sajuData as SajuResult[]).map((s, i) => ({ person: persons[i], saju: s }))
    : [{ person: persons[0], saju: report.sajuData as SajuResult }];

  return (
    <div className="mx-auto max-w-[430px] px-5 py-8">
      <header className="text-center">
        <p className="text-xs tracking-widest text-ink-soft">{product?.name}</p>
        <h1 className="mt-1 text-xl font-bold">
          {isLove ? `${persons[0].name} ♥ ${persons[1].name}` : `${persons[0].name}님의 리포트`}
        </h1>
        <p className="mt-2 rounded-lg bg-accent-soft/60 px-3 py-2 text-xs text-accent-strong">
          이 페이지 주소가 리포트 열람 링크예요. 브라우저에 저장하거나 나에게 카톡으로 보내두세요.
        </p>
        {siblings.length > 0 && (
          <nav className="mt-3 flex flex-wrap justify-center gap-2">
            {siblings.map((s) => (
              <Link
                key={s.token}
                href={`/report/${s.token}`}
                className="rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium text-accent-strong transition hover:border-accent"
              >
                {getProduct(s.productCode)?.name ?? s.productCode} 보기 →
              </Link>
            ))}
          </nav>
        )}
      </header>

      <div className="mt-6 space-y-4">
        {sajuList.map(({ person, saju }, i) => (
          <details key={i} open={!isLove} className="group">
            <summary className="cursor-pointer list-none">
              <div className="mb-2 flex items-center justify-between rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-bold">
                <span>{isLove ? `${person.name}의 사주 데이터` : "나의 사주 데이터"}</span>
                <span className="text-xs font-normal text-ink-soft group-open:hidden">펼치기</span>
              </div>
            </summary>
            <div className="space-y-4">
              <PillarTable saju={saju} />
              <StarProfile saju={saju} />
              <ElementChart saju={saju} />
            </div>
          </details>
        ))}

        {/* 해석 본문은 종이 시트 — 긴 글은 크림 바탕에서 읽게 한다(팔자표는 night 카드) */}
        <div className="paper rounded-2xl bg-bg p-3">
          <StreamingReport
            token={token}
            initialStatus={report.status}
            initialRawText={content?.rawText ?? null}
            longForm={report.productCode === "deep"}
          />
        </div>

        {report.status === "done" && (
          <a
            href={`/report/${token}/pdf`}
            className="block rounded-xl border border-line bg-card px-4 py-3.5 text-center text-sm font-bold transition hover:border-accent"
          >
            <Icon name="doc" size={15} /> PDF로 저장하기
          </a>
        )}

        {/* 질문·채점·후기는 전부 입력 폼이라 종이 카드로 묶는다 */}
        <div className="paper space-y-4">
          {report.status === "done" && (
            <AskReport
              token={token}
              initialQa={
                ((report.content as { qa?: { q: string; a: string; at: string }[] } | null)?.qa ??
                  [])[0] ?? null
              }
            />
          )}

          {report.status === "done" && (
            <PredictionScore
              token={token}
              createdAtIso={(report.completedAt ?? report.createdAt).toISOString()}
              initialGrade={
                (report.content as {
                  predictionGrade?: {
                    verdict: "hit" | "half" | "miss";
                    note?: string;
                    at: string;
                  };
                } | null)?.predictionGrade ?? null
              }
            />
          )}

          <ReviewForm token={token} initial={existingReview} />
        </div>
      </div>
    </div>
  );
}

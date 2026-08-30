// 예측 성적표 — 고객이 시간이 지난 뒤 돌아와 리포트의 예측을 직접 채점한다.
// 업계 전체가 회피하는 "예측 검증"을 정면으로 받는 것이 오롭미의 차별화 축 (2026-08-30 설계).
// 원칙: 빗나간 채점도 지우지 않는다 — 이 기록 자체가 신뢰 자산이다.
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, reports } from "@/lib/db";

export const runtime = "nodejs";

const VERDICTS = ["hit", "half", "miss"] as const;
type Verdict = (typeof VERDICTS)[number];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const body = (await req.json().catch(() => null)) as
    | { verdict?: string; note?: string }
    | null;
  const verdict = body?.verdict as Verdict | undefined;
  if (!verdict || !VERDICTS.includes(verdict)) {
    return NextResponse.json({ error: "bad verdict" }, { status: 400 });
  }
  const note = (body?.note ?? "").trim().slice(0, 300);

  const db = getDb();
  const rows = await db.select().from(reports).where(eq(reports.token, token)).limit(1);
  const report = rows[0];
  if (!report) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (report.status !== "done") {
    return NextResponse.json({ error: "완성된 리포트만 채점할 수 있어요." }, { status: 409 });
  }
  // 생성 직후 채점은 의미가 없다 — 최소 30일 지나야 "시간이 검증"한 것.
  const doneAt = report.completedAt ?? report.createdAt;
  const days = (Date.now() - new Date(doneAt).getTime()) / 86400000;
  if (days < 30) {
    return NextResponse.json(
      { error: "예측 채점은 리포트 30일 후부터 열려요. 그때 다시 와주세요." },
      { status: 409 },
    );
  }

  const content = (report.content ?? {}) as Record<string, unknown>;
  await db
    .update(reports)
    .set({
      content: {
        ...content,
        predictionGrade: { verdict, note, at: new Date().toISOString(), daysAfter: Math.floor(days) },
      },
    })
    .where(eq(reports.token, token));
  return NextResponse.json({ ok: true });
}

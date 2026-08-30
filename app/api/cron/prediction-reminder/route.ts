// 예측 검증 리마인더 — 리포트 6개월 뒤 "그때 그 예측, 맞았나요?" 메일.
// 사주 업계 전체가 회피하는 재방문 트리거: 예측을 걸어두고 검증받으러 오게 한다.
// Vercel Cron이 매일 1회 호출 (vercel.json). CRON_SECRET 설정 시 Bearer 검증.
import { and, eq, gte, isNotNull, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, orders, reports } from "@/lib/db";
import { sendPredictionReminder } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getDb();
  // 완성 175~185일 지난 유료 리포트 (윈도가 10일이라 크론이 며칠 죽어도 안 놓친다)
  const from = new Date(Date.now() - 185 * 86400000);
  const to = new Date(Date.now() - 175 * 86400000);
  const rows = await db
    .select({
      token: reports.token,
      content: reports.content,
      inputData: reports.inputData,
      productCode: reports.productCode,
      orderId: reports.orderId,
      email: orders.email,
    })
    .from(reports)
    .innerJoin(orders, eq(reports.orderId, orders.id))
    .where(
      and(
        eq(reports.status, "done"),
        isNotNull(reports.orderId),
        gte(reports.completedAt, from),
        lte(reports.completedAt, to),
      ),
    )
    .limit(50);

  let sent = 0;
  for (const r of rows) {
    const content = (r.content ?? {}) as Record<string, unknown> & {
      predictionGrade?: unknown;
      reminderSentAt?: string;
    };
    if (!r.email || content.predictionGrade || content.reminderSentAt) continue;
    const name =
      (r.inputData as { persons?: { name?: string }[] })?.persons?.[0]?.name ?? "고객";
    const ok = await sendPredictionReminder({ to: r.email, name, token: r.token });
    if (ok) {
      await db
        .update(reports)
        .set({ content: { ...content, reminderSentAt: new Date().toISOString() } })
        .where(eq(reports.token, r.token));
      sent++;
    }
  }
  return NextResponse.json({ checked: rows.length, sent });
}

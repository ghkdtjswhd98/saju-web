import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, reports, reviews } from "@/lib/db";
import type { PersonInput } from "@/lib/saju/types";

// 이름 익명화 — "지민" → "지**", "김서연" → "김**"
function anonymize(name: string) {
  const first = name.trim().charAt(0) || "익";
  return first + "*".repeat(Math.max(2, name.trim().length - 1));
}

// 후기 작성/수정 — 리포트 토큰 보유 = 실보유자 증명. 유료 리포트만, 리포트당 1건(수정 가능)
export async function POST(req: NextRequest) {
  let body: { token?: string; rating?: number; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token : "";
  const rating = Number(body.rating);
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!token || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "별점을 선택해주세요." }, { status: 400 });
  }
  if (text.length < 5 || text.length > 300) {
    return NextResponse.json(
      { error: "후기는 5자 이상 300자 이하로 적어주세요." },
      { status: 400 },
    );
  }

  const db = getDb();
  const rows = await db
    .select({
      token: reports.token,
      orderId: reports.orderId,
      productCode: reports.productCode,
      inputData: reports.inputData,
    })
    .from(reports)
    .where(eq(reports.token, token))
    .limit(1);
  const report = rows[0];
  if (!report || report.productCode.startsWith("free")) {
    return NextResponse.json({ error: "리포트를 찾을 수 없어요." }, { status: 404 });
  }

  const persons = (report.inputData as { persons: PersonInput[] }).persons;
  await db
    .insert(reviews)
    .values({
      reportToken: token,
      rating,
      text,
      displayName: anonymize(persons?.[0]?.name ?? ""),
      productCode: report.productCode,
      // 주문 없이 발급된 리포트(체험단 증정)는 체험단 라벨 — 공정위 표시 지침
      isTester: report.orderId ? 0 : 1,
    })
    .onConflictDoUpdate({
      target: reviews.reportToken,
      set: { rating, text },
    });

  return NextResponse.json({ ok: true });
}

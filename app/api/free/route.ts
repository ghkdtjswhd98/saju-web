import { and, eq, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getDb, reports } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { computeAll } from "@/lib/saju/compute";
import { hashPersonInput, parsePersonInput } from "@/lib/validate";

export const runtime = "nodejs";

// 무료 맛보기 신청: 계산 + 리포트 행 생성 → shareId 반환 (해석 생성은 stream 라우트에서)
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }
  const person = parsePersonInput(body);
  if (!person) {
    return NextResponse.json({ error: "입력값을 확인해주세요." }, { status: 400 });
  }

  const db = getDb();
  const inputHash = hashPersonInput(person);

  // 동일 입력 24시간 내 재요청 → 기존 결과 재사용 (비용 절감 + 어뷰즈 방어)
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = await db
    .select({ token: reports.token, status: reports.status })
    .from(reports)
    .where(
      and(
        eq(reports.inputHash, inputHash),
        eq(reports.productCode, "free"),
        gt(reports.createdAt, dayAgo),
      ),
    )
    .limit(1);
  if (existing.length && existing[0].status !== "failed") {
    return NextResponse.json({ shareId: existing[0].token, reused: true });
  }

  // 새 생성은 레이트리밋 적용 (재열람은 제한 없음)
  const allowed = await checkRateLimit(getClientIp(req));
  if (!allowed) {
    return NextResponse.json(
      { error: "오늘 무료 사주 횟수를 모두 사용했어요. 내일 다시 만나요!" },
      { status: 429 },
    );
  }

  let saju;
  try {
    saju = computeAll(person);
  } catch {
    return NextResponse.json(
      { error: "지원하지 않는 날짜예요. 1900~2050년 사이인지 확인해주세요." },
      { status: 400 },
    );
  }

  const token = nanoid(24);
  await db.insert(reports).values({
    token,
    productCode: "free",
    inputData: { persons: [person] },
    inputHash,
    sajuData: saju,
    status: "pending",
  });

  return NextResponse.json({ shareId: token });
}

import { and, eq, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getDb, reports } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { computeAll } from "@/lib/saju/compute";
import { hashPersonInput, parsePersonInput } from "@/lib/validate";
import type { PersonInput } from "@/lib/saju/types";

export const runtime = "nodejs";

// 무료 맛보기 신청: 계산 + 리포트 행 생성 → shareId 반환 (해석 생성은 stream 라우트에서)
// 1인 = free(사주), 2인 = free_love(궁합 티저)
export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    console.error("[api/free]", err);
    const message = err instanceof Error ? err.message : "서버 오류가 발생했어요.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handle(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  // { persons: [...] } 형식 (구버전 단일 객체도 허용)
  const rawPersons = Array.isArray((body as { persons?: unknown[] })?.persons)
    ? (body as { persons: unknown[] }).persons
    : [body];
  if (rawPersons.length < 1 || rawPersons.length > 2) {
    return NextResponse.json({ error: "입력 인원이 맞지 않아요." }, { status: 400 });
  }
  const persons: PersonInput[] = [];
  for (const raw of rawPersons) {
    const p = parsePersonInput(raw);
    if (!p) return NextResponse.json({ error: "입력값을 확인해주세요." }, { status: 400 });
    persons.push(p);
  }
  const productCode = persons.length === 2 ? "free_love" : "free";

  const db = getDb();
  const inputHash = persons.map(hashPersonInput).join(":");

  // 동일 입력 24시간 내 재요청 → 기존 결과 재사용 (비용 절감 + 어뷰즈 방어)
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = await db
    .select({ token: reports.token, status: reports.status })
    .from(reports)
    .where(
      and(
        eq(reports.inputHash, inputHash),
        eq(reports.productCode, productCode),
        gt(reports.createdAt, dayAgo),
      ),
    )
    .limit(1);
  if (existing.length && existing[0].status !== "failed") {
    return NextResponse.json({ shareId: existing[0].token, reused: true });
  }

  // 새 생성은 레이트리밋 적용 (재열람은 제한 없음)
  const limit = await checkRateLimit(getClientIp(req));
  if (limit === "ip_limited") {
    return NextResponse.json(
      { error: "오늘 무료 사주 횟수를 모두 사용했어요. 내일 다시 만나요!" },
      { status: 429 },
    );
  }
  if (limit === "global_limited") {
    return NextResponse.json(
      { error: "오늘 준비된 무료 사주가 모두 소진됐어요. 내일 자정에 다시 열려요!" },
      { status: 429 },
    );
  }

  let sajuData: unknown;
  try {
    sajuData = persons.length === 2 ? persons.map((p) => computeAll(p)) : computeAll(persons[0]);
  } catch {
    return NextResponse.json(
      { error: "지원하지 않는 날짜예요. 1900~2050년 사이인지 확인해주세요." },
      { status: 400 },
    );
  }

  const token = nanoid(24);
  await db.insert(reports).values({
    token,
    productCode,
    inputData: { persons },
    inputHash,
    sajuData,
    status: "pending",
  });

  return NextResponse.json({ shareId: token });
}

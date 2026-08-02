// 개발 전용 유틸 라우트 — 결제 없이 유료 리포트 품질 테스트용.
// PGlite(단일 프로세스 DB) 환경에서 외부 스크립트가 DB를 직접 열 수 없어 HTTP로 시드한다.
// 보호: DEV_SEED_SECRET 헤더 필수, 프로덕션에서는 비활성.
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getDb, rateLimits, reports } from "@/lib/db";
import { computeAll } from "@/lib/saju/compute";
import { getProduct } from "@/lib/products";
import { parsePersonInput } from "@/lib/validate";
import type { PersonInput } from "@/lib/saju/types";

export const runtime = "nodejs";

function guard(req: Request): NextResponse | null {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (req.headers.get("x-dev-secret") !== process.env.DEV_SEED_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(req: Request) {
  const denied = guard(req);
  if (denied) return denied;

  const body = (await req.json()) as {
    action: "seed" | "info" | "clear_limits";
    productCode?: string;
    persons?: unknown[];
    token?: string;
  };
  const db = getDb();

  if (body.action === "clear_limits") {
    await db.delete(rateLimits);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "seed") {
    const product = getProduct(body.productCode ?? "");
    if (!product) return NextResponse.json({ error: "bad product" }, { status: 400 });
    const persons: PersonInput[] = [];
    for (const raw of body.persons ?? []) {
      const p = parsePersonInput(raw);
      if (!p) return NextResponse.json({ error: "bad person" }, { status: 400 });
      persons.push(p);
    }
    if (persons.length !== product.personCount) {
      return NextResponse.json({ error: "person count" }, { status: 400 });
    }
    const sajuData =
      product.personCount === 2 ? persons.map((p) => computeAll(p)) : computeAll(persons[0]);
    const token = nanoid(24);
    await db.insert(reports).values({
      token,
      productCode: product.code,
      inputData: { persons },
      sajuData,
      status: "pending",
    });
    return NextResponse.json({ token });
  }

  if (body.action === "info") {
    const rows = await db
      .select()
      .from(reports)
      .where(eq(reports.token, body.token ?? ""))
      .limit(1);
    if (!rows.length) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  }

  return NextResponse.json({ error: "bad action" }, { status: 400 });
}

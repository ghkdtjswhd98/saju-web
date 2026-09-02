// 관리자 숏폼 대본 생성 API — "AI 쇼츠 딸깍"의 우리 버전 (대본까지, 조립은 CapCut).
// 강의 벤치마킹(2026-09-02): 띠·상품·말투 입력 → 훅·타임코드 대본·자막·캡션·고정댓글 일괄 출력.
import { NextResponse } from "next/server";
import { getAnthropic, PAID_MODEL } from "@/lib/anthropic";
import { getProduct } from "@/lib/products";
import { buildShortsSystem, buildShortsUser, CTA_KEYWORD, TONES, TTIS } from "@/lib/marketing/shorts-gen";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    adminKey?: string;
    ttiKey?: string;
    productCode?: string;
    tone?: string;
  } | null;
  if (!process.env.ADMIN_KEY || body?.adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const tti = TTIS.find((t) => t.key === body?.ttiKey);
  const product = getProduct(body?.productCode ?? "");
  const tone = body?.tone && TONES[body.tone] ? body.tone : "dosa";
  if (!tti || !product) {
    return NextResponse.json({ error: "bad input" }, { status: 400 });
  }

  const res = await getAnthropic().messages.create({
    model: PAID_MODEL,
    max_tokens: 3000,
    system: buildShortsSystem(CTA_KEYWORD[product.code] ?? "운세"),
    messages: [{ role: "user", content: buildShortsUser(tti, product, tone) }],
  });
  const markdown = res.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("")
    .trim();
  if (!markdown) return NextResponse.json({ error: "생성 실패" }, { status: 500 });
  return NextResponse.json({ tti: tti.name, emoji: tti.emoji, markdown });
}

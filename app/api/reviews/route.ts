import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { issueReviewCoupon, REVIEW_COUPON_BENEFIT } from "@/lib/coupons";
import { getDb, reports, reviews } from "@/lib/db";
import { checkActionLimit, getClientIp } from "@/lib/ratelimit";
import type { PersonInput } from "@/lib/saju/types";

// 후기는 랜딩·상품 페이지에 공개 노출되므로 링크·연락처 삽입(광고/피싱)을 차단
const REVIEW_BANNED =
  /(https?:\/\/|www\.|\.com|\.co\.kr|\.kr\/|\.net|010[-.\s]?\d{3,4}[-.\s]?\d{4}|오픈\s*채팅|카톡\s*아이디|카카오\s*아이디|텔레그램)/i;

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
  if (REVIEW_BANNED.test(text)) {
    return NextResponse.json(
      { error: "후기에는 링크나 연락처를 담을 수 없어요." },
      { status: 400 },
    );
  }
  if (!(await checkActionLimit("review", getClientIp(req), 10))) {
    return NextResponse.json(
      { error: "오늘은 더 이상 후기를 수정할 수 없어요." },
      { status: 429 },
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
  const isTester = report.orderId ? 0 : 1;
  await db
    .insert(reviews)
    .values({
      reportToken: token,
      rating,
      text,
      displayName: anonymize(persons?.[0]?.name ?? ""),
      productCode: report.productCode,
      // 주문 없이 발급된 리포트(체험단 증정)는 체험단 라벨 — 공정위 표시 지침
      isTester,
      // 후기를 남기면 쿠폰을 주므로, 구매 후기라도 "대가를 받은 후기"가 된다.
      // 체험단은 제품 자체가 대가이므로 그쪽 라벨을 우선한다.
      rewardType: isTester ? "tester" : "coupon",
    })
    .onConflictDoUpdate({
      target: reviews.reportToken,
      set: { rating, text },
    });

  // ⚠️ 별점과 무관하게 발급한다. 1점 후기에도 똑같이 준다 —
  //    높은 별점에만 주는 순간 대가성 리뷰 유도가 되어 공정위 제재 대상이다.
  //    발급 실패가 후기 저장을 되돌려서는 안 되므로 여기서 막지 않는다.
  const coupon = await issueReviewCoupon(token).catch((e) => {
    console.error("[api/reviews] 쿠폰 발급 실패:", e);
    return null;
  });

  return NextResponse.json({
    ok: true,
    coupon: coupon ? { code: coupon, benefit: REVIEW_COUPON_BENEFIT } : null,
  });
}

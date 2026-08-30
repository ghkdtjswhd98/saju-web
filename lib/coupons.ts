import { customAlphabet } from "nanoid";
import { and, eq, isNull } from "drizzle-orm";
import { getDb, couponCodes } from "@/lib/db";

// 사람이 채팅으로 불러주고 받아적는 코드다.
// 0/O, 1/I/L 처럼 헷갈리는 글자를 빼야 "코드가 안 먹혀요" 문의가 생기지 않는다.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const chunk = customAlphabet(ALPHABET, 4);

export const REVIEW_COUPON_BENEFIT = "올해 운세 리포트 1회 무료";

function newCode(): string {
  return `OROB-${chunk()}-${chunk()}`;
}

/**
 * 후기 작성자에게 리워드 쿠폰을 발급한다.
 *
 * ⚠️ 별점과 무관하게 발급해야 한다. 높은 별점에만 주면 대가성 리뷰 유도이고,
 *    공정위 「추천·보증 등에 관한 표시·광고 심사지침」 위반이다.
 *
 * 리포트당 1장(issuedForToken unique). 이미 있으면 기존 코드를 그대로 돌려준다 —
 * 후기를 수정할 때마다 새 쿠폰이 나오면 무한 발급이 된다.
 */
export async function issueReviewCoupon(reportToken: string): Promise<string | null> {
  const db = getDb();
  const existing = await db
    .select({ code: couponCodes.code })
    .from(couponCodes)
    .where(eq(couponCodes.issuedForToken, reportToken))
    .limit(1);
  if (existing[0]) return existing[0].code;

  // 코드 충돌은 사실상 없지만(31^8), 충돌 시 조용히 실패하는 대신 몇 번 다시 뽑는다
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const code = newCode();
      await db.insert(couponCodes).values({
        code,
        kind: "review",
        benefit: REVIEW_COUPON_BENEFIT,
        issuedForToken: reportToken,
      });
      return code;
    } catch {
      // unique 충돌 — issuedForToken 쪽이면 동시 요청이므로 기존 코드를 반환
      const again = await db
        .select({ code: couponCodes.code })
        .from(couponCodes)
        .where(eq(couponCodes.issuedForToken, reportToken))
        .limit(1);
      if (again[0]) return again[0].code;
    }
  }
  console.error("[coupons] 코드 발급 실패:", reportToken);
  return null;
}

export type CouponLookup =
  | { status: "not_found" }
  | { status: "used"; code: string; benefit: string; usedAt: Date; usedNote: string | null }
  | { status: "valid"; code: string; benefit: string };

/** 운영자 콘솔에서 코드 확인 — 당근 채팅으로 코드를 받았을 때 유효한지 본다. */
export async function lookupCoupon(rawCode: string): Promise<CouponLookup> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { status: "not_found" };
  const rows = await getDb()
    .select()
    .from(couponCodes)
    .where(eq(couponCodes.code, code))
    .limit(1);
  const row = rows[0];
  if (!row) return { status: "not_found" };
  if (row.usedAt) {
    return {
      status: "used",
      code: row.code,
      benefit: row.benefit,
      usedAt: row.usedAt,
      usedNote: row.usedNote,
    };
  }
  return { status: "valid", code: row.code, benefit: row.benefit };
}

/** 사용 처리. 이미 사용된 코드면 false. */
export async function redeemCoupon(rawCode: string, note: string): Promise<boolean> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return false;
  // 미사용 조건을 UPDATE의 WHERE에 넣는다 — 조회 후 갱신으로 나누면
  // 동시 요청 두 건이 모두 "아직 미사용"을 보고 둘 다 통과한다.
  const updated = await getDb()
    .update(couponCodes)
    .set({ usedAt: new Date(), usedNote: note.slice(0, 300) })
    .where(and(eq(couponCodes.code, code), isNull(couponCodes.usedAt)))
    .returning({ code: couponCodes.code });
  return updated.length > 0;
}

import { desc, eq } from "drizzle-orm";
import { getDb, reviews } from "@/lib/db";

export type ReviewItem = {
  rating: number;
  text: string;
  displayName: string;
  productCode: string;
  isTester: number;
  createdAt: Date;
};

// 랜딩/상품 페이지 노출용 — 최근 후기 + 통계 (전부 실데이터)
export async function getReviewSummary(limit = 6) {
  const rows = await getDb()
    .select({
      rating: reviews.rating,
      text: reviews.text,
      displayName: reviews.displayName,
      productCode: reviews.productCode,
      isTester: reviews.isTester,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .orderBy(desc(reviews.createdAt))
    .limit(100);

  const count = rows.length;
  const avg = count ? rows.reduce((s, r) => s + r.rating, 0) / count : 0;
  return { count, avg, recent: rows.slice(0, limit) as ReviewItem[] };
}

// 리포트 페이지에서 기존 후기 프리필용
export async function getReviewByToken(token: string) {
  const rows = await getDb()
    .select({ rating: reviews.rating, text: reviews.text })
    .from(reviews)
    .where(eq(reviews.reportToken, token))
    .limit(1);
  return rows[0] ?? null;
}

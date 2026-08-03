/**
 * 런칭 직전 1회 실행 — 개발/E2E 테스트 데이터 전체 삭제.
 * (orders/reports/reviews/rate_limits 전부 테스트 산출물인 시점에만 사용할 것.
 *  실서비스 개시 후에는 절대 실행 금지 — 실제 주문·후기가 지워진다.)
 *
 * 실행: npx tsx scripts/wipe-test-data.ts --yes
 */
import postgres from "postgres";

async function main() {
  if (!process.argv.includes("--yes")) {
    console.log("실수 방지: --yes 플래그를 붙여야 실행됩니다.");
    process.exit(1);
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL 필요 (.env.local 값을 환경변수로 전달)");

  const sql = postgres(url, { prepare: false, max: 1 });
  // FK 순서: reviews → reports → orders
  const reviews = await sql`delete from reviews returning report_token`;
  const reports = await sql`delete from reports returning token`;
  const orders = await sql`delete from orders returning id`;
  const limits = await sql`delete from rate_limits returning key`;
  console.log(
    `삭제 완료 — 후기 ${reviews.length}건, 리포트 ${reports.length}건, 주문 ${orders.length}건, 레이트리밋 ${limits.length}건`,
  );
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

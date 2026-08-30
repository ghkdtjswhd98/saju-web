/**
 * 2026-08-07 마이그레이션 — 후기 리워드 쿠폰 + 환불 요청 접수
 *   npx tsx scripts/migrate-2026-08-07.ts
 *
 * 왜 drizzle-kit push를 쓰지 않는가:
 *   push는 schema.ts와 실DB의 "차이"를 없애려 하므로, DB에만 있는 것을 지우려 들 수 있다.
 *   여기서 필요한 건 순수 추가뿐이라, 되돌릴 수 없는 위험을 감수할 이유가 없다.
 *
 * ⚠️ DDL은 Transaction Pooler(6543)에서 불안정하다 — Session Pooler(5432)로 바꿔 접속한다.
 * 모든 문장이 멱등(IF NOT EXISTS)이라 여러 번 돌려도 안전하다.
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";

const STATEMENTS: { label: string; sql: string }[] = [
  {
    label: "reviews.reward_type 컬럼 추가 (대가성 표시 — 공정위 심사지침)",
    sql: `alter table reviews add column if not exists reward_type text not null default 'none'`,
  },
  {
    label: "coupon_codes 테이블 생성 (후기 리워드 쿠폰)",
    sql: `create table if not exists coupon_codes (
      code text primary key,
      kind text not null,
      benefit text not null,
      issued_for_token text not null unique,
      used_at timestamptz,
      used_note text,
      created_at timestamptz not null default now()
    )`,
  },
  {
    label: "refund_requests 테이블 생성 (불만 사유 수집)",
    sql: `create table if not exists refund_requests (
      id text primary key,
      report_token text not null,
      reason text not null,
      contact text,
      resolved integer not null default 0,
      created_at timestamptz not null default now()
    )`,
  },
];

function loadDatabaseUrl(): string {
  let url = process.env.DATABASE_URL;
  if (!url) {
    const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    url = env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "");
  }
  if (!url) throw new Error("DATABASE_URL을 찾을 수 없습니다.");
  // Transaction Pooler → Session Pooler. DDL은 세션 단위 연결이 필요하다.
  return url.replace(":6543/", ":5432/");
}

async function main() {
  const sql = postgres(loadDatabaseUrl(), { prepare: false, max: 1 });
  try {
    for (const { label, sql: stmt } of STATEMENTS) {
      await sql.unsafe(stmt);
      console.log(`✅ ${label}`);
    }

    // 실제로 반영됐는지 확인 — "성공했다고 하는데 안 된" 경우를 잡는다
    const cols = await sql`
      select column_name from information_schema.columns
      where table_name = 'reviews' and column_name = 'reward_type'`;
    const tables = await sql`
      select table_name from information_schema.tables
      where table_name in ('coupon_codes', 'refund_requests')`;
    console.log(
      `\n검증: reviews.reward_type ${cols.length ? "있음" : "❌ 없음"} / ` +
        `테이블 ${tables.map((t) => t.table_name).join(", ") || "❌ 없음"}`,
    );
    if (!cols.length || tables.length !== 2) process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

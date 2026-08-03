import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import postgres from "postgres";
import * as schema from "./schema";

// PGlite(로컬 임베디드 Postgres) 폴백용 DDL — schema.ts와 반드시 동기화 유지
const PGLITE_DDL = `
create table if not exists orders (
  id text primary key,
  product_code text not null,
  amount integer not null,
  status text not null default 'pending',
  payment_key text,
  input_data jsonb not null,
  report_token text,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);
create table if not exists reports (
  token text primary key,
  order_id text references orders(id),
  product_code text not null,
  input_data jsonb not null,
  input_hash text,
  saju_data jsonb not null,
  content jsonb,
  model text,
  status text not null default 'pending',
  "usage" jsonb,
  generating_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists reports_input_hash_idx on reports (input_hash);
create table if not exists rate_limits (
  key text primary key,
  count integer not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists reviews (
  report_token text primary key references reports(token),
  rating integer not null,
  text text not null,
  display_name text not null,
  product_code text not null,
  is_tester integer not null default 0,
  created_at timestamptz not null default now()
);
`;

// USE_PGLITE=1 이면 로컬 파일 DB 사용 (Supabase 장애/미설정 시 개발용 폴백).
// ⚠️ PGlite는 단일 프로세스 전용 — dev 서버 외 다른 프로세스에서 같은 데이터 디렉토리를 열지 말 것.
function createDb() {
  if (process.env.USE_PGLITE === "1") {
    // 동적 require: 프로덕션 번들에서 불필요한 wasm 로드를 피한다
    const { PGlite } = require("@electric-sql/pglite") as typeof import("@electric-sql/pglite");
    const client = new PGlite("./.pglite-data");
    // PGlite는 쿼리를 순차 실행하므로 DDL을 먼저 큐에 넣어두면 이후 쿼리가 대기한다
    client.exec(PGLITE_DDL).catch((e: unknown) => console.error("[pglite] DDL 실패:", e));
    return drizzlePglite(client, { schema }) as unknown as ReturnType<typeof createPostgresDb>;
  }
  return createPostgresDb();
}

// Supabase Transaction Pooler(6543)는 prepared statement 미지원 — prepare: false 필수
function createPostgresDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL이 설정되지 않았습니다. Supabase 프로젝트의 연결 문자열을 .env.local에 넣어주세요.",
    );
  }
  const client = postgres(url, { prepare: false, max: 1 });
  return drizzlePostgres(client, { schema });
}

// 서버리스 핫 리로드/재사용 대비 전역 캐시
const globalForDb = globalThis as unknown as { __db?: ReturnType<typeof createDb> };

export function getDb() {
  if (!globalForDb.__db) globalForDb.__db = createDb();
  return globalForDb.__db;
}

export { orders, reports, rateLimits, reviews } from "./schema";

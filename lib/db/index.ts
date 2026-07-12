import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Supabase Transaction Pooler(6543)는 prepared statement 미지원 — prepare: false 필수
function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL이 설정되지 않았습니다. Supabase 프로젝트의 연결 문자열을 .env.local에 넣어주세요.",
    );
  }
  const client = postgres(url, { prepare: false, max: 1 });
  return drizzle(client, { schema });
}

// 서버리스 핫 리로드/재사용 대비 전역 캐시
const globalForDb = globalThis as unknown as { __db?: ReturnType<typeof createDb> };

export function getDb() {
  if (!globalForDb.__db) globalForDb.__db = createDb();
  return globalForDb.__db;
}

export { orders, reports, rateLimits } from "./schema";

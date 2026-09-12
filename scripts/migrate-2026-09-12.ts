/**
 * 2026-09-12 마이그레이션 — 케미 초대 링크 (chemi_links / chemi_replies)
 *   npx tsx scripts/migrate-2026-09-12.ts
 *
 * drizzle-kit push를 쓰지 않는 이유는 migrate-2026-08-07.ts와 같다(순수 추가만, 삭제 위험 없음).
 * DDL은 Transaction Pooler(6543)에서 불안정하므로 Session Pooler(5432)로 접속한다.
 * 모든 문장이 멱등(IF NOT EXISTS)이라 여러 번 돌려도 안전하다. SQL 원문: drizzle/2026-09-12-chemi.sql
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";

function loadDatabaseUrl(): string {
  let url = process.env.DATABASE_URL;
  if (!url) {
    const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    url = env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "");
  }
  if (!url) throw new Error("DATABASE_URL을 찾을 수 없습니다.");
  return url.replace(":6543/", ":5432/");
}

async function main() {
  const ddl = readFileSync(new URL("../drizzle/2026-09-12-chemi.sql", import.meta.url), "utf8");
  const sql = postgres(loadDatabaseUrl(), { prepare: false, max: 1 });
  try {
    // 문장 단위로 나눠 실행 — 어느 문장에서 실패했는지 바로 보이게
    const body = ddl.replace(/^--.*$/gm, ""); // 주석 줄은 문장 분리 전에 걷어낸다
    for (const stmt of body.split(";").map((s) => s.trim()).filter(Boolean)) {
      await sql.unsafe(stmt);
      console.log(`✅ ${stmt.split("\n")[0].slice(0, 60)}`);
    }
    const tables = await sql`
      select table_name from information_schema.tables
      where table_name in ('chemi_links', 'chemi_replies')`;
    console.log(`\n검증: 테이블 ${tables.map((t) => t.table_name).join(", ") || "❌ 없음"}`);
    if (tables.length !== 2) process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

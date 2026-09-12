/**
 * 2026-09-13 마이그레이션 — 케미 순위 비공개 옵션 (chemi_replies.is_private / chemi_links.board_public)
 *   npx tsx scripts/migrate-2026-09-13.ts
 *
 * drizzle-kit push를 쓰지 않는 이유는 migrate-2026-08-07.ts와 같다(순수 추가만, 삭제 위험 없음).
 * DDL은 Transaction Pooler(6543)에서 불안정하므로 Session Pooler(5432)로 접속한다.
 * 모든 문장이 멱등(ADD COLUMN IF NOT EXISTS)이라 여러 번 돌려도 안전하다. SQL 원문: drizzle/2026-09-13-chemi-privacy.sql
 * 선행 조건: migrate-2026-09-12.ts(테이블 생성)가 먼저 적용돼 있어야 한다.
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
  const ddl = readFileSync(new URL("../drizzle/2026-09-13-chemi-privacy.sql", import.meta.url), "utf8");
  const sql = postgres(loadDatabaseUrl(), { prepare: false, max: 1 });
  try {
    // 문장 단위로 나눠 실행 — 어느 문장에서 실패했는지 바로 보이게
    const body = ddl.replace(/^--.*$/gm, ""); // 주석 줄은 문장 분리 전에 걷어낸다
    for (const stmt of body.split(";").map((s) => s.trim()).filter(Boolean)) {
      await sql.unsafe(stmt);
      console.log(`✅ ${stmt.split("\n")[0].slice(0, 60)}`);
    }
    const cols = await sql`
      select table_name, column_name from information_schema.columns
      where (table_name = 'chemi_replies' and column_name = 'is_private')
         or (table_name = 'chemi_links' and column_name = 'board_public')`;
    const found = cols.map((c) => `${c.table_name}.${c.column_name}`);
    console.log(`\n검증: 컬럼 ${found.join(", ") || "❌ 없음"}`);
    if (cols.length !== 2) process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

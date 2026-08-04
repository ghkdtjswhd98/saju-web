/**
 * 리포트 개인화 품질 점검 — 저장된 리포트가 서로 얼마나 다른지 수치로 확인한다.
 *
 *   npx tsx scripts/check-quality.ts
 *
 * 왜: 오롭미 최대 실패 모드는 "남과 결과가 똑같다"이고, 이용자는 실제로 친구와 대조한다.
 * 이 검증을 통과 못 하면 반응이 "재미없다"가 아니라 "사기"가 된다. 사람 눈 대신 숫자로 잡는다.
 *
 * 종료 코드: 경고가 하나라도 있으면 1 (새벽 자율 루프가 실패로 인지할 수 있게)
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import { findCliches } from "../lib/quality/cliche";
import { pairwiseSimilarity } from "../lib/quality/similarity";

// 같은 상품·다른 사람이면 섹션명·존댓말 어미가 구조적으로 겹쳐 0.2~0.3은 정상.
// 그 이상은 문장 템플릿 재사용을 의심할 구간 — 첫 실행의 실제 분포를 보고 조정한다.
const SIMILARITY_WARN = 0.35;

function loadDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  const m = raw.match(/^DATABASE_URL=(.+)$/m);
  if (!m) throw new Error("DATABASE_URL을 찾을 수 없어요 (.env.local 확인)");
  return m[1].trim();
}

interface Row {
  token: string;
  product_code: string;
  content: { rawText?: string } | null;
}

async function main() {
  const sql = postgres(loadDatabaseUrl(), { prepare: false, max: 1 });
  let rows: Row[];
  try {
    rows = (await sql`
      select token, product_code, content from reports
      where status = 'done' order by created_at desc limit 200
    `) as unknown as Row[];
  } finally {
    await sql.end();
  }

  const byProduct = new Map<string, { id: string; text: string }[]>();
  let emptyCount = 0;
  for (const r of rows) {
    const text = r.content?.rawText ?? "";
    if (!text.trim()) {
      emptyCount++;
      continue;
    }
    const list = byProduct.get(r.product_code) ?? [];
    list.push({ id: r.token.slice(0, 8), text });
    byProduct.set(r.product_code, list);
  }

  let warnings = 0;
  console.log(`총 ${rows.length}건 조회 (본문 있는 것만 비교)\n`);

  for (const [product, items] of [...byProduct.entries()].sort()) {
    console.log(`── ${product} (${items.length}건)`);

    if (items.length < 2) {
      console.log("   표본 부족 — 비교 생략\n");
      continue;
    }

    const pairs = pairwiseSimilarity(items).slice(0, 3);
    for (const p of pairs) {
      const flag = p.score > SIMILARITY_WARN ? "⚠️" : "✅";
      console.log(`   ${flag} ${p.a} ↔ ${p.b} : ${p.score.toFixed(3)}`);
      if (p.score > SIMILARITY_WARN) warnings++;
    }

    let clicheTotal = 0;
    for (const item of items) {
      const hits = findCliches(item.text);
      if (hits.length) {
        clicheTotal += hits.length;
        console.log(`   ⚠️ ${item.id} 클리셰 ${hits.length}건: ${hits.map((h) => h.rule).join(", ")}`);
        console.log(`      "${hits[0].excerpt}"`);
      }
    }
    if (clicheTotal) warnings += clicheTotal;
    else console.log("   ✅ 클리셰 없음");
    console.log("");
  }

  if (emptyCount) {
    console.log(`⚠️ 본문이 빈 완료 리포트 ${emptyCount}건 — 생성은 됐는데 내용이 없어요\n`);
    warnings += emptyCount;
  }

  if (warnings) {
    console.log(`판정: 경고 ${warnings}건 — 프롬프트 점검이 필요해요`);
    process.exit(1);
  }
  console.log("판정: 통과 ✅");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

/**
 * 일간 카드뉴스 PNG 일괄 추출 — dev 서버(localhost:3000) 켠 상태에서 실행.
 *   npx tsx scripts/export-cards.ts
 * → marketing/cards/{일간key}/slide-0.png ~ slide-5.png (10일간 × 6장 = 60장)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ILGAN_LIST } from "../lib/ilgan-content";

const BASE = process.env.CARD_BASE_URL ?? "http://localhost:3000";

async function main() {
  for (const ilgan of ILGAN_LIST) {
    const dir = join(process.cwd(), "marketing", "cards", ilgan.key);
    mkdirSync(dir, { recursive: true });
    for (let slide = 0; slide <= 5; slide++) {
      const res = await fetch(`${BASE}/ilgan/${ilgan.key}/card-image?slide=${slide}`);
      if (!res.ok) throw new Error(`${ilgan.key} slide ${slide}: HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(join(dir, `slide-${slide}.png`), buf);
    }
    console.log(`✅ ${ilgan.korean} (${ilgan.key}) 6장 저장`);
  }
  console.log("완료 — marketing/cards/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

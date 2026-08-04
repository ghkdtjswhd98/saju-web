/**
 * 당근·SNS 판매글용 상품 썸네일 일괄 추출 — dev 서버 켠 상태에서 실행.
 *   npx tsx scripts/export-sale-images.ts
 * → marketing/sale/{상품코드}.png (1080×1080) + avatar.png (512×512)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PRODUCTS } from "../lib/products";

const BASE = process.env.CARD_BASE_URL ?? "http://localhost:3000";

async function save(url: string, out: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  writeFileSync(out, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  const dir = join(process.cwd(), "marketing", "sale");
  mkdirSync(dir, { recursive: true });

  for (const p of Object.values(PRODUCTS)) {
    await save(`${BASE}/brand/sale-image?product=${p.code}`, join(dir, `${p.code}.png`));
    console.log(`✅ ${p.name}`);
  }
  await save(`${BASE}/brand/avatar`, join(dir, "avatar.png"));
  console.log("✅ 프로필 아바타");
  console.log("완료 — marketing/sale/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * 체험단용 유료 리포트 무상 발급 — 주문 없이 리포트 행만 생성.
 * 주문이 없으므로(order_id null) 후기 작성 시 자동으로 "체험단 제공" 라벨이 붙는다.
 *
 * 실행 예:
 *   npx tsx scripts/issue-tester-report.ts --name 홍길동 --birth 1995-03-15 --gender 여
 *   npx tsx scripts/issue-tester-report.ts --name 홍길동 --birth 1995-03-15 --gender 남 --hour 14 --lunar
 *   (--hour 생략 = 시간 모름, --product lifetime|year|career 기본 lifetime)
 *
 * DATABASE_URL은 .env.local에서 자동 로드. 생성 직후엔 status=pending —
 * 링크를 처음 여는 순간 AI 생성이 시작된다 (건당 원가 약 200~320원).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { customAlphabet } from "nanoid";
import postgres from "postgres";
import { computeAll } from "../lib/saju/compute";
import type { PersonInput } from "../lib/saju/types";

const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-",
  24,
);

function loadEnvLocal() {
  if (process.env.DATABASE_URL) return;
  const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  const m = raw.match(/^DATABASE_URL=(.+)$/m);
  if (m) process.env.DATABASE_URL = m[1].trim();
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  loadEnvLocal();
  const name = arg("name");
  const birth = arg("birth"); // YYYY-MM-DD
  const gender = arg("gender") as "남" | "여" | undefined;
  const hour = arg("hour"); // 0~23 정수(시각), 생략 시 모름
  const product = arg("product") ?? "lifetime";
  const isLunar = process.argv.includes("--lunar");

  if (!name || !birth || !gender || !["남", "여"].includes(gender)) {
    console.log(
      "사용법: npx tsx scripts/issue-tester-report.ts --name 이름 --birth 1995-03-15 --gender 여 [--hour 14] [--lunar] [--product lifetime|year|career]",
    );
    process.exit(1);
  }
  if (!["lifetime", "year", "career"].includes(product)) {
    console.error("product는 lifetime|year|career 중 하나 (love는 2인이라 미지원)");
    process.exit(1);
  }

  const [y, mo, d] = birth.split("-").map(Number);
  // hourValue는 지지시 시작 시각(짝수) — 홀수 시각 입력 시 내림 보정
  const hourValue =
    hour === undefined ? "unknown" : String(Math.floor(Number(hour) / 2) * 2);

  const person: PersonInput = {
    name,
    gender,
    year: y,
    month: mo,
    day: d,
    hourValue,
    isLunar,
    isLeap: false,
  };
  const saju = computeAll(person);
  const token = nanoid();

  const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
  await sql`
    insert into reports (token, order_id, product_code, input_data, saju_data, status)
    values (${token}, ${null}, ${product}, ${JSON.stringify({ persons: [person] })}, ${JSON.stringify(saju)}, 'pending')
  `;
  await sql.end();

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://saju-web-orobmi.vercel.app";
  console.log(`✅ 체험단 리포트 발급 완료 (${product}, 주문 없음 → 후기에 체험단 라벨 자동)`);
  console.log(`   ${site.replace("http://localhost:3000", "https://saju-web-orobmi.vercel.app")}/report/${token}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

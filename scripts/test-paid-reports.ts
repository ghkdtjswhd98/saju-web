// 유료 리포트 4종 품질 테스트 — dev 시드 라우트로 행 생성 → 스트리밍 생성 → 검증 리포트 출력
// DB 직접 접근 없이 HTTP만 사용 (PGlite 단일 프로세스 제약 대응)
// 실행: npx tsx --env-file=.env.local scripts/test-paid-reports.ts [productCode...]
import { FORMATS } from "../lib/prompts/formats";

const BASE_URL = "http://localhost:3000";
const SECRET = process.env.DEV_SEED_SECRET ?? "";

const P_A = {
  name: "지민", gender: "여", year: 1996, month: 11, day: 23,
  hourValue: "14", isLunar: false, isLeap: false,
};
const P_B = {
  name: "준호", gender: "남", year: 1994, month: 4, day: 2,
  hourValue: "unknown", isLunar: false, isLeap: false,
};

// 본문 노출 금지 용어 (단음절 글자는 오탐이 커서 다음절 용어만 검사)
const FORBIDDEN = [
  "비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인",
  "천을귀인", "도화살", "역마살", "화개살", "문창귀인", "양인살",
  "십신", "지장간", "오행 분포",
];

async function devApi(body: object): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE_URL}/api/dev`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-dev-secret": SECRET },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) throw new Error(`dev api ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

async function generateOne(productCode: string): Promise<void> {
  const persons = productCode === "love" ? [P_A, P_B] : [P_A];
  const { token } = (await devApi({ action: "seed", productCode, persons })) as { token: string };

  console.log(`\n━━━ [${productCode}] 생성 시작 (token=${token})`);
  const t0 = Date.now();
  const res = await fetch(`${BASE_URL}/api/reports/${token}/stream`);
  if (!res.ok || !res.body) throw new Error(`stream HTTP ${res.status}`);
  const reader = res.body.getReader();
  while (true) {
    const { done } = await reader.read();
    if (done) break;
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(0);

  const row = await devApi({ action: "info", token });
  const content = row.content as { blocks: Record<string, string>; rawText: string } | null;
  const usage = row.usage as Record<string, number> | null;

  console.log(`상태: ${row.status} (${secs}초)`);
  if (row.status !== "done" || !content) {
    console.log("❌ 생성 실패");
    return;
  }

  // 1. 마커 파싱 검증
  const expected = FORMATS[productCode].markers.map((m) => m.key);
  const parsedKeys = Object.keys(content.blocks);
  const parseOk = !("raw" in content.blocks) && expected.every((k) => parsedKeys.includes(k));
  console.log(`파싱: ${parseOk ? "✅" : "❌"} (기대 ${expected.length}섹션 / 실제 ${parsedKeys.join(",")})`);

  // 2. 분량
  console.log(`분량: ${content.rawText.length.toLocaleString()}자`);
  for (const k of expected) {
    console.log(`  - ${k}: ${(content.blocks[k] ?? "").length}자`);
  }

  // 3. 금지어 검사
  const leaks = FORBIDDEN.filter((w) => content.rawText.includes(w));
  console.log(`금지어: ${leaks.length === 0 ? "✅ 없음" : `❌ 누출: ${leaks.join(", ")}`}`);

  // 4. 원가 (Opus 4.8: 입력 $5/M, 출력 $25/M, 캐시쓰기 1.25x, 캐시읽기 0.1x — 환율 1400원)
  if (usage) {
    const cost =
      ((usage.input_tokens ?? 0) * 5 +
        (usage.cache_creation_input_tokens ?? 0) * 6.25 +
        (usage.cache_read_input_tokens ?? 0) * 0.5 +
        (usage.output_tokens ?? 0) * 25) /
      1_000_000;
    console.log(
      `토큰: in=${usage.input_tokens} cacheW=${usage.cache_creation_input_tokens} cacheR=${usage.cache_read_input_tokens} out=${usage.output_tokens} → 원가 $${cost.toFixed(4)} (약 ${(cost * 1400).toFixed(0)}원)`,
    );
  }

  // 5. 본문 샘플 (품질 눈검사용 — 앞 500자)
  console.log(`── 본문 샘플:\n${content.rawText.slice(0, 500)}\n──`);
  console.log(`열람 URL: ${BASE_URL}/report/${token}`);
}

async function main() {
  const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["lifetime", "love", "year", "career"];
  for (const p of targets) {
    await generateOne(p);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

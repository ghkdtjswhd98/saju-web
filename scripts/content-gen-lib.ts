// SNS 콘텐츠 생성 공용 모듈 — 숏폼 대본·쓰레드 글 생성기가 함께 쓴다.
// 원칙: 훅은 세게, 근거는 진짜(만세력 지지 관계), 낙인·저주·공포·가짜 시한 금지.
// 출처: 2026-08-30 강의 분석(docs/superpowers/specs/ 참조) + social 스킬(3초 룰, 자막 규격).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { detectJijiRelations } from "../lib/saju/compute";

export function loadEnvLocal(): void {
  try {
    const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.+)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {
    /* .env.local 없으면 환경변수 그대로 사용 */
  }
}

export function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

export function getModel(): string {
  return arg("model") || process.env.PAID_MODEL || "claude-opus-4-8";
}

export async function generate(system: string, user: string, maxTokens = 4000): Promise<string> {
  const client = new Anthropic();
  const res = await client.messages.create({
    model: getModel(),
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  return res.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
}

// ── 띠 데이터 ─────────────────────────────────────────────────
export interface Tti {
  key: string; // 파일명용 로마자
  name: string; // "쥐띠"
  branch: string; // 지지 한글 한 글자
  emoji: string;
}

export const TTIS: Tti[] = [
  { key: "rat", name: "쥐띠", branch: "자", emoji: "🐀" },
  { key: "ox", name: "소띠", branch: "축", emoji: "🐂" },
  { key: "tiger", name: "호랑이띠", branch: "인", emoji: "🐅" },
  { key: "rabbit", name: "토끼띠", branch: "묘", emoji: "🐇" },
  { key: "dragon", name: "용띠", branch: "진", emoji: "🐉" },
  { key: "snake", name: "뱀띠", branch: "사", emoji: "🐍" },
  { key: "horse", name: "말띠", branch: "오", emoji: "🐎" },
  { key: "sheep", name: "양띠", branch: "미", emoji: "🐑" },
  { key: "monkey", name: "원숭이띠", branch: "신", emoji: "🐒" },
  { key: "rooster", name: "닭띠", branch: "유", emoji: "🐓" },
  { key: "dog", name: "개띠", branch: "술", emoji: "🐕" },
  { key: "pig", name: "돼지띠", branch: "해", emoji: "🐖" },
];

export const THIS_YEAR = 2026;
export const YEAR_BRANCH = "오"; // 병오년(말의 해)
export const YEAR_LABEL = "병오년";

/** 띠 지지와 올해 지지의 실제 관계(합·충·형 등) — 콘텐츠의 결정론적 근거 */
export function ttiYearRelation(tti: Tti): string {
  const rel = detectJijiRelations([tti.branch, YEAR_BRANCH]);
  const hits: string[] = [];
  for (const [kind, arr] of Object.entries(rel)) {
    for (const item of arr) hits.push(`${item}(${kind})`);
  }
  // 육해·파는 엔진 미검출 항목 — 수동 테이블 (표준 명리 이론)
  const HAE: Record<string, string> = { 축: "축오해", 오: "축오해" };
  const PA: Record<string, string> = { 묘: "묘오파", 오: "묘오파" };
  if (HAE[tti.branch] && tti.branch !== YEAR_BRANCH) hits.push(`${HAE[tti.branch]}(해)`);
  if (PA[tti.branch] && tti.branch !== YEAR_BRANCH) hits.push(`${PA[tti.branch]}(파)`);
  return hits.length ? hits.join(", ") : "특별한 형충합 없음 (평탄한 흐름)";
}

// ── 공용 가드레일 (모든 SNS 콘텐츠 공통) ──────────────────────
export const CONTENT_GUARDRAILS = `# 오롭미 콘텐츠 가드레일 (위반 시 실패)
- 낙인·저주·공포 금지: "삼재라 큰일난다", "액운이 낀다", 질병·사고·죽음 언급 금지.
- 가짜 시한 금지: 날짜를 쓰려면 실제 절기·명절·월말 등 실재하는 날만. 지어내지 말 것.
- 확정 예언 금지: "~된다" 단정 대신 "~하기 쉬운 흐름", "~가 들어오는 해" 같은 경향의 언어.
- 근거 없는 말 금지: 제공된 지지 관계(합·충·형·해·파)에서만 운세 서사를 끌어낼 것.
- 전문용어는 딱 하나만 허용: 관계 이름(충/합/형)은 "부딪히는 기운", "끌어주는 기운"처럼 풀어 쓰되,
  후킹용으로 "충이 들어온다" 정도의 한 단어 노출은 허용.
- 반말·직설은 허용 (콘텐츠 컨셉). 비하·욕설·조롱은 금지.
- 과장 수치 금지: 조회수·판매량·적중률 등 숫자를 지어내지 말 것.`;

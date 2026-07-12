// Claude API 호출 — 반드시 서버(Route Handler)에서만 import할 것
import Anthropic from "@anthropic-ai/sdk";
import { BASE_REFERENCE } from "./prompts/base-reference";

export const FREE_MODEL = process.env.FREE_MODEL || "claude-haiku-4-5";
export const PAID_MODEL = process.env.PAID_MODEL || "claude-opus-4-8";

let client: Anthropic | null = null;
export function getAnthropic(): Anthropic {
  if (!client) client = new Anthropic(); // ANTHROPIC_API_KEY 환경변수 사용
  return client;
}

export interface StreamReportArgs {
  model: string;
  formatSystem: string; // 상품별 출력 형식 프롬프트
  userPrompt: string;   // 계산값 XML
  maxTokens: number;
  useThinking?: boolean; // 유료(Opus)만 true — Haiku는 adaptive 미지원
}

// system = [공유 레퍼런스(캐싱), 상품별 형식(캐싱)] + user 메시지.
// 캐싱 프리픽스는 상품 간 첫 블록을 공유하므로 트래픽이 생기면 원가가 내려간다.
export function streamReport({ model, formatSystem, userPrompt, maxTokens, useThinking }: StreamReportArgs) {
  return getAnthropic().messages.stream({
    model,
    max_tokens: maxTokens,
    ...(useThinking ? { thinking: { type: "adaptive" as const } } : {}),
    system: [
      { type: "text", text: BASE_REFERENCE, cache_control: { type: "ephemeral" } },
      { type: "text", text: formatSystem, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });
}

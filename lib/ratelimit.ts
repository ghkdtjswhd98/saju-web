// 무료 맛보기 레이트리밋 — Postgres 카운터 (외부 서비스 추가 없이 동작)
import { sql } from "drizzle-orm";
import { getDb, rateLimits } from "./db";

const DAILY_LIMIT_PER_IP = 3;
// 서비스 전체 일일 상한 — 바이럴 폭주 시 최악의 API 비용을 제한 (300건 ≈ Haiku 1만 원 남짓)
const DAILY_LIMIT_GLOBAL = Number(process.env.FREE_DAILY_GLOBAL_LIMIT || 300);

// 한국 사용자 기준 자정 리셋 (UTC 기준이면 오전 9시에 리셋되어 어색함)
function kstDay(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

async function bumpCounter(key: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .insert(rateLimits)
    .values({ key, count: 1 })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: { count: sql`${rateLimits.count} + 1`, updatedAt: sql`now()` },
    })
    .returning({ count: rateLimits.count });
  return rows[0]?.count ?? Number.MAX_SAFE_INTEGER;
}

export type RateLimitResult = "ok" | "ip_limited" | "global_limited";

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const day = kstDay();
  // IP 체크가 반드시 먼저 — 전역 카운터를 먼저 올리면 단일 IP의 반복 요청(4회째부터
  // 거절이어도 전역은 계속 증가)만으로 그날 무료 퍼널 전체를 잠글 수 있다(그리핑 DoS).
  const ipCount = await bumpCounter(`${ip}:${day}`);
  if (ipCount > DAILY_LIMIT_PER_IP) return "ip_limited";
  const globalCount = await bumpCounter(`global:${day}`);
  if (globalCount > DAILY_LIMIT_GLOBAL) return "global_limited";
  return "ok";
}

// 범용 IP 액션 리밋 — 주문 생성·후기 작성 등 무제한이면 안 되는 쓰기 경로에 사용
export async function checkActionLimit(
  action: string,
  ip: string,
  dailyLimit: number,
): Promise<boolean> {
  const count = await bumpCounter(`${action}:${ip}:${kstDay()}`);
  return count <= dailyLimit;
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

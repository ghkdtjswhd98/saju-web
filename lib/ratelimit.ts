// 무료 맛보기 IP 레이트리밋 — Postgres 카운터 (외부 서비스 추가 없이 동작)
import { sql } from "drizzle-orm";
import { getDb, rateLimits } from "./db";

const DAILY_LIMIT = 3;

// true = 허용, false = 한도 초과
export async function checkRateLimit(ip: string): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10); // yyyy-mm-dd (UTC 기준)
  const key = `${ip}:${day}`;
  const db = getDb();
  const rows = await db
    .insert(rateLimits)
    .values({ key, count: 1 })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: { count: sql`${rateLimits.count} + 1`, updatedAt: sql`now()` },
    })
    .returning({ count: rateLimits.count });
  return (rows[0]?.count ?? Number.MAX_SAFE_INTEGER) <= DAILY_LIMIT;
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

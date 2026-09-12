// 케미 초대 링크 — DB 접근 (서버 전용). 계산 규칙은 lib/saju/chemi-link.ts, 점수 엔진은 lib/saju/chemistry.ts
import { eq } from "drizzle-orm";
import { customAlphabet, nanoid } from "nanoid";
import { chemiLinks, chemiReplies, getDb } from "./db";
import {
  CHEMI_CODE_LEN, CHEMI_NICKNAME_MAX, CHEMI_OWNER_KEY_LEN, rankReplies, type ChemiRankRow,
} from "./saju/chemi-link";
import type { ChemiSubset } from "./saju/chemistry";

// 0/O·1/l/I 같은 헷갈리는 글자 제외 — 카톡으로 불러주거나 손으로 칠 때 틀리지 않게
const makeCode = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", CHEMI_CODE_LEN);
const CODE_RE = /^[a-z0-9]{8}$/;

export function isChemiCode(v: unknown): v is string {
  return typeof v === "string" && CODE_RE.test(v);
}

/** 별명 정제 — 비면 null. 길이는 순위판 한 줄에 들어가는 만큼만 */
export function parseNickname(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.replace(/\s+/g, " ").trim().slice(0, CHEMI_NICKNAME_MAX);
  return v || null;
}

export interface ChemiLink {
  code: string;
  nickname: string;
  sajuSubset: ChemiSubset;
  ownerKey: string;
}

export async function getChemiLink(code: string): Promise<ChemiLink | null> {
  if (!isChemiCode(code)) return null;
  const rows = await getDb().select().from(chemiLinks).where(eq(chemiLinks.code, code)).limit(1);
  const r = rows[0];
  if (!r) return null;
  return {
    code: r.code,
    nickname: r.nickname,
    sajuSubset: r.sajuSubset as ChemiSubset,
    ownerKey: r.ownerKey,
  };
}

export async function createChemiLink(nickname: string, subset: ChemiSubset): Promise<ChemiLink> {
  const link: ChemiLink = {
    code: makeCode(),
    nickname,
    sajuSubset: subset,
    ownerKey: nanoid(CHEMI_OWNER_KEY_LEN),
  };
  await getDb().insert(chemiLinks).values(link);
  return link;
}

export async function addChemiReply(
  linkCode: string,
  nickname: string,
  score: number,
  label: string,
): Promise<void> {
  await getDb().insert(chemiReplies).values({ id: `cr_${nanoid(16)}`, linkCode, nickname, score, label });
}

/** 순위판 전체(점수 내림차순, 동점은 먼저 답한 순) */
export async function listChemiRanking(linkCode: string): Promise<ChemiRankRow[]> {
  const rows = await getDb()
    .select({
      nickname: chemiReplies.nickname,
      score: chemiReplies.score,
      label: chemiReplies.label,
      createdAt: chemiReplies.createdAt,
    })
    .from(chemiReplies)
    .where(eq(chemiReplies.linkCode, linkCode))
    .orderBy(chemiReplies.createdAt);
  return rankReplies(rows).map(({ nickname, score, label, rank }) => ({ nickname, score, label, rank }));
}

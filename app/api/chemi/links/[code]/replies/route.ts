import { NextResponse } from "next/server";
import { addChemiReply, getChemiLink, listChemiRanking, parseNickname } from "@/lib/chemi";
import { checkActionLimit, getClientIp } from "@/lib/ratelimit";
import { chemiLabel, rankOf } from "@/lib/saju/chemi-link";
import { computeChemistryFromSubsets, toChemiSubset } from "@/lib/saju/chemistry";
import { computeAll } from "@/lib/saju/compute";
import { parsePersonInput } from "@/lib/validate";

export const runtime = "nodejs";

// 하루 IP당 응답 상한 — 단톡방 한 명이 여러 친구 생일을 대신 넣는 경우도 감안해 넉넉히
const DAILY_REPLY_LIMIT = 30;

// 친구 응답: { person, nickname } → 링크 주인과의 케미 계산 → 저장 → { score, label, rank, total, nickname }
// nickname은 정제(공백 접기·12자)된 저장값 — 클라이언트가 순위판에서 본인 줄을 찾을 때 이 값을 쓴다.
// 친구의 생년월일·파생값은 저장하지 않는다 — 점수와 라벨만 남는다.
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    return await handle(req, (await params).code);
  } catch (err) {
    console.error("[api/chemi/replies]", err);
    return NextResponse.json({ error: "서버 오류가 발생했어요." }, { status: 500 });
  }
}

async function handle(req: Request, code: string) {
  const link = await getChemiLink(code);
  if (!link) return NextResponse.json({ error: "링크를 찾을 수 없어요." }, { status: 404 });

  let body: { person?: unknown; nickname?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }
  const nickname = parseNickname(body.nickname);
  if (!nickname) return NextResponse.json({ error: "별명을 입력해주세요." }, { status: 400 });
  // 케미는 지지·오행만 쓰므로 성별을 받지 않는다(대운 불필요)
  const p = parsePersonInput(body.person, { genderOptional: true });
  if (!p) return NextResponse.json({ error: "입력값을 확인해주세요." }, { status: 400 });

  const ok = await checkActionLimit("chemi_reply", getClientIp(req), DAILY_REPLY_LIMIT);
  if (!ok) {
    return NextResponse.json(
      { error: "오늘은 여기까지예요. 내일 다시 해볼 수 있어요!" },
      { status: 429 },
    );
  }

  let score: number;
  try {
    score = computeChemistryFromSubsets(link.sajuSubset, toChemiSubset(computeAll(p))).score;
  } catch {
    return NextResponse.json(
      { error: "지원하지 않는 날짜예요. 1900~2050년 사이인지 확인해주세요." },
      { status: 400 },
    );
  }
  const label = chemiLabel(score);
  await addChemiReply(code, nickname, score, label);

  // 방금 저장한 건을 포함한 순위 — 동점은 같은 등수
  const ranking = await listChemiRanking(code);
  const rank = rankOf(ranking.map((r) => r.score), score);
  return NextResponse.json({ score, label, rank, total: ranking.length, nickname, ownerNickname: link.nickname });
}

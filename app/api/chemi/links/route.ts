import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createChemiLink, parseNickname } from "@/lib/chemi";
import { getDb, reports } from "@/lib/db";
import { checkActionLimit, getClientIp } from "@/lib/ratelimit";
import { toChemiSubset, type ChemiSubset } from "@/lib/saju/chemistry";
import { computeAll } from "@/lib/saju/compute";
import type { PersonInput, SajuResult } from "@/lib/saju/types";
import { DEFAULT_PERSON_NAME, parsePersonInput } from "@/lib/validate";

export const runtime = "nodejs";

// 하루 IP당 링크 생성 상한 — AI 비용은 없지만 행이 무한히 쌓이는 건 막는다
const DAILY_CREATE_LIMIT = 20;

// 케미 초대 링크 생성: { shareId } (무료 결과에서) 또는 { person, nickname } (직접 입력)
// → 케미 계산에 필요한 파생값만 저장하고 {code, ownerKey} 반환. 생년월일 원본은 저장하지 않는다.
export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    console.error("[api/chemi/links]", err);
    return NextResponse.json({ error: "서버 오류가 발생했어요." }, { status: 500 });
  }
}

async function handle(req: Request) {
  let body: { shareId?: unknown; person?: unknown; nickname?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  let nickname: string | null = null;
  let subset: ChemiSubset | null = null;

  if (typeof body.shareId === "string") {
    // 무료 결과 재사용 — 이미 계산된 사주 스냅샷에서 파생값만 뽑는다 (재계산·재입력 없음)
    const rows = await getDb()
      .select({ productCode: reports.productCode, inputData: reports.inputData, sajuData: reports.sajuData })
      .from(reports)
      .where(eq(reports.token, body.shareId))
      .limit(1);
    const r = rows[0];
    if (!r || !r.productCode.startsWith("free")) {
      return NextResponse.json({ error: "무료 결과를 찾을 수 없어요." }, { status: 404 });
    }
    const persons = (r.inputData as { persons: PersonInput[] }).persons;
    // 궁합(2인) 결과면 첫 번째 사람(나)이 링크 주인
    const saju = Array.isArray(r.sajuData) ? (r.sajuData as SajuResult[])[0] : (r.sajuData as SajuResult);
    // 무료 폼은 이름이 선택이라 비우면 "고객"이 저장돼 있다 — 그걸 별명으로 쓰면 "고객님과 너의 케미는?"이 된다
    const ownName = persons[0]?.name === DEFAULT_PERSON_NAME ? null : persons[0]?.name;
    nickname = parseNickname(body.nickname) ?? parseNickname(ownName) ?? "친구";
    subset = toChemiSubset(saju);
  } else {
    nickname = parseNickname(body.nickname);
    if (!nickname) return NextResponse.json({ error: "별명을 입력해주세요." }, { status: 400 });
    // 케미는 지지·오행만 쓰므로 성별을 받지 않는다(대운 불필요)
    const p = parsePersonInput(body.person, { genderOptional: true });
    if (!p) return NextResponse.json({ error: "입력값을 확인해주세요." }, { status: 400 });
    try {
      subset = toChemiSubset(computeAll(p));
    } catch {
      return NextResponse.json(
        { error: "지원하지 않는 날짜예요. 1900~2050년 사이인지 확인해주세요." },
        { status: 400 },
      );
    }
  }

  const ok = await checkActionLimit("chemi_create", getClientIp(req), DAILY_CREATE_LIMIT);
  if (!ok) {
    return NextResponse.json(
      { error: "오늘 만들 수 있는 링크를 모두 사용했어요. 내일 다시 만나요!" },
      { status: 429 },
    );
  }

  const link = await createChemiLink(nickname, subset);
  return NextResponse.json({ code: link.code, ownerKey: link.ownerKey });
}

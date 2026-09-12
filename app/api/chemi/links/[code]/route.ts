import { NextResponse } from "next/server";
import { getChemiLink, listChemiRanking, setChemiBoardPublic } from "@/lib/chemi";
import { publicBoardView } from "@/lib/saju/chemi-link";

export const runtime = "nodejs";

// 링크 정보 + 순위판.
//   주인(헤더 x-owner-key 일치): 전체 순위(각 행 isPrivate 포함) + boardPublic
//   친구: 잠금이면 { locked: true, total }만, 공개면 비공개 응답을 뺀 상위 5 + privateCount + total
// 키를 쿼리스트링으로는 받지 않는다 — URL에 실리면 접근 로그·리퍼러·히스토리에 남는다.
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const link = await getChemiLink(code);
    if (!link) return NextResponse.json({ error: "링크를 찾을 수 없어요." }, { status: 404 });

    const ranking = await listChemiRanking(code);
    if (isOwnerRequest(req, link.ownerKey)) {
      return NextResponse.json({
        nickname: link.nickname,
        isOwner: true,
        boardPublic: link.boardPublic,
        total: ranking.length,
        replies: ranking,
      });
    }
    return NextResponse.json({
      nickname: link.nickname,
      isOwner: false,
      ...publicBoardView(ranking, link.boardPublic),
    });
  } catch (err) {
    console.error("[api/chemi/links/code]", err);
    return NextResponse.json({ error: "서버 오류가 발생했어요." }, { status: 500 });
  }
}

// 주인 토글 "순위판 친구에게 공개 / 나만 보기" — body { boardPublic: boolean }, x-owner-key 필수
export async function PATCH(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const link = await getChemiLink(code);
    if (!link) return NextResponse.json({ error: "링크를 찾을 수 없어요." }, { status: 404 });
    if (!isOwnerRequest(req, link.ownerKey)) {
      return NextResponse.json({ error: "링크를 만든 분만 바꿀 수 있어요." }, { status: 403 });
    }

    let body: { boardPublic?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
    }
    if (typeof body.boardPublic !== "boolean") {
      return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
    }

    await setChemiBoardPublic(code, body.boardPublic);
    return NextResponse.json({ boardPublic: body.boardPublic });
  } catch (err) {
    console.error("[api/chemi/links/code:PATCH]", err);
    return NextResponse.json({ error: "서버 오류가 발생했어요." }, { status: 500 });
  }
}

function isOwnerRequest(req: Request, ownerKey: string): boolean {
  const key = req.headers.get("x-owner-key");
  return Boolean(key) && key === ownerKey;
}

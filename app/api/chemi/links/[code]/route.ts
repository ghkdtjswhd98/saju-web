import { NextResponse } from "next/server";
import { getChemiLink, listChemiRanking } from "@/lib/chemi";

export const runtime = "nodejs";

// 링크 공개 응답에서 보여주는 순위 수 — 전체는 주인(ownerKey 일치)만
const PUBLIC_TOP = 5;

// 링크 정보 + 순위판. 주인 키(헤더 x-owner-key)가 맞으면 전체, 아니면 상위 5.
// 키를 쿼리스트링으로는 받지 않는다 — URL에 실리면 접근 로그·리퍼러·히스토리에 남는다.
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const link = await getChemiLink(code);
    if (!link) return NextResponse.json({ error: "링크를 찾을 수 없어요." }, { status: 404 });

    const key = req.headers.get("x-owner-key");
    const isOwner = Boolean(key) && key === link.ownerKey;

    const ranking = await listChemiRanking(code);
    return NextResponse.json({
      nickname: link.nickname,
      total: ranking.length,
      isOwner,
      replies: isOwner ? ranking : ranking.slice(0, PUBLIC_TOP),
    });
  } catch (err) {
    console.error("[api/chemi/links/code]", err);
    return NextResponse.json({ error: "서버 오류가 발생했어요." }, { status: 500 });
  }
}

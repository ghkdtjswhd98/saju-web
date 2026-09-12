import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ChemiLanding from "@/components/chemi/ChemiLanding";
import { getChemiLink, listChemiRanking } from "@/lib/chemi";
import { publicBoardView } from "@/lib/saju/chemi-link";

// 순위는 답이 올 때마다 바뀐다 — 캐시 없이 매 요청 조회
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const link = await getChemiLink(code);
  if (!link) return {};
  return {
    title: `${link.nickname}님이 케미를 물어봤어요`,
    description: "생일만 넣으면 나와요 — 로그인 없이 10초. 누가 제일 잘 맞는지 순위도 볼 수 있어요.",
    // 개인 초대 링크 — 검색 색인 금지 (공유로만 유입)
    robots: { index: false },
  };
}

export default async function ChemiLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const link = await getChemiLink(code);
  if (!link) notFound();

  // 서버 렌더는 항상 친구 기준(비공개 제외·잠금 반영) — 주인 전체 순위는 클라이언트가 ownerKey로 다시 받는다
  const board = publicBoardView(await listChemiRanking(code), link.boardPublic);

  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <ChemiLanding code={code} nickname={link.nickname} initialBoard={board} />
    </div>
  );
}

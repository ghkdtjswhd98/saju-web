import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ChemiLanding from "@/components/chemi/ChemiLanding";
import { getChemiLink, listChemiRanking } from "@/lib/chemi";

// 순위는 답이 올 때마다 바뀐다 — 캐시 없이 매 요청 조회
export const dynamic = "force-dynamic";

const PUBLIC_TOP = 5;

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

  const ranking = await listChemiRanking(code);

  return (
    <div className="mx-auto max-w-[430px] px-5 py-10">
      <ChemiLanding
        code={code}
        nickname={link.nickname}
        initialRows={ranking.slice(0, PUBLIC_TOP)}
        initialTotal={ranking.length}
      />
    </div>
  );
}

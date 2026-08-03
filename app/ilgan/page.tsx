import type { Metadata } from "next";
import Link from "next/link";
import Orobi from "@/components/Orobi";
import { ILGAN_LIST } from "@/lib/ilgan-content";

export const metadata: Metadata = {
  title: "일간(日干)으로 보는 성격 — 갑목부터 계수까지 10가지 유형",
  description:
    "사주에서 '나'를 뜻하는 글자, 일간. 갑목·을목·병화·정화·무토·기토·경금·신금·임수·계수 10가지 일간별 성격·연애·직업 총정리.",
};

export default function IlganIndexPage() {
  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <header className="text-center">
        <div className="flex justify-center">
          <Orobi size={96} />
        </div>
        <h1 className="mt-3 text-2xl font-bold leading-snug">
          일간(日干) — 사주에서
          <br />
          &lsquo;나&rsquo;를 뜻하는 단 한 글자
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          사주팔자 여덟 글자 중 태어난 날의 천간이 바로 나예요.
          <br />내 일간이 뭔지 모른다면{" "}
          <Link href="/" className="text-accent-strong underline">
            무료 사주
          </Link>
          에서 30초 만에 확인할 수 있어요.
        </p>
      </header>

      <div className="mt-7 grid grid-cols-2 gap-3">
        {ILGAN_LIST.map((i) => (
          <Link
            key={i.key}
            href={`/ilgan/${i.key}`}
            className="rounded-2xl border border-line bg-card p-4 transition hover:border-accent"
          >
            <p className="text-2xl">{i.emoji}</p>
            <p className="mt-1.5 text-[15px] font-bold">
              {i.korean} ({i.hanja})
            </p>
            <p className="mt-1 line-clamp-2 text-xs leading-4 text-ink-soft">{i.nickname}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

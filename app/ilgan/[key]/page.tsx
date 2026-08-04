import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Orobi from "@/components/Orobi";
import { ILGAN_LIST, ILGAN_MAP } from "@/lib/ilgan-content";

export function generateStaticParams() {
  return ILGAN_LIST.map(({ key }) => ({ key }));
}

// 마지막 글자 받침 유무 — 조사(이라도/라도) 선택용
function hasBatchim(word: string): boolean {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}): Promise<Metadata> {
  const { key } = await params;
  const c = ILGAN_MAP[key];
  if (!c) return {};
  return {
    title: `${c.korean}(${c.hanja}) 일간 성격 — 특징·연애·직업 총정리`,
    description: `${c.symbol}, ${c.korean} 일간. ${c.keywords.join(" · ")}. 강점과 그늘, 어울리는 일과 연애 스타일까지 한 번에.`,
  };
}

export default async function IlganPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const c = ILGAN_MAP[key];
  if (!c) notFound();

  return (
    <div className="mx-auto max-w-xl px-5 py-8">
      <header className="text-center">
        <p className="text-xs tracking-widest text-ink-soft">일간으로 보는 나</p>
        <p className="mt-3 text-5xl">{c.emoji}</p>
        <h1 className="mt-2 text-2xl font-bold">
          {c.korean} ({c.hanja}) — {c.yinYang}의 {c.element}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">{c.symbol}</p>
        <ul className="mt-3 flex justify-center gap-1.5">
          {c.keywords.map((k) => (
            <li
              key={k}
              className="rounded-full bg-accent-soft/60 px-3 py-1 text-xs font-medium text-accent-strong"
            >
              {k}
            </li>
          ))}
        </ul>
      </header>

      <section className="mt-7 rounded-2xl border border-line bg-card p-5">
        <h2 className="text-sm font-bold tracking-widest text-accent-strong">
          &ldquo;{c.nickname}&rdquo;
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-7">
          {c.personality.map((p) => (
            <p key={p.slice(0, 12)}>{p}</p>
          ))}
        </div>
      </section>

      <section className="mt-4 grid gap-4">
        <div className="rounded-2xl border border-line bg-card p-5 text-sm leading-7">
          <h2 className="font-bold">💪 이 일간의 무기</h2>
          <p className="mt-1.5">{c.strengths}</p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5 text-sm leading-7">
          <h2 className="font-bold">🌘 의식하면 좋은 그늘</h2>
          <p className="mt-1.5">{c.shadow}</p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5 text-sm leading-7">
          <h2 className="font-bold">💼 어울리는 일</h2>
          <p className="mt-1.5">{c.work}</p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5 text-sm leading-7">
          <h2 className="font-bold">💕 연애 스타일</h2>
          <p className="mt-1.5">{c.love}</p>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border-2 border-accent bg-card p-5 text-center">
        <div className="flex justify-center">
          <Orobi size={72} />
        </div>
        <p className="mt-2 text-sm text-ink-soft">여기까지는 일간 하나로 본 이야기예요</p>
        <h2 className="mt-1 text-lg font-bold leading-snug">
          같은 {c.korean}{hasBatchim(c.korean) ? "이" : ""}라도 나머지 일곱 글자에
          <br />
          따라 완전히 다른 사람이 돼요
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          내 사주 여덟 글자 전체를 만세력으로 정확히 계산해드려요.
          <br />
          회원가입 없이 30초, 무료.
        </p>
        <Link
          href="/"
          className="mt-4 block rounded-xl bg-accent-strong px-4 py-3.5 text-[15px] font-bold text-white transition hover:opacity-90"
        >
          내 사주팔자 무료로 확인하기 →
        </Link>
      </section>

      <nav className="mt-6 flex flex-wrap justify-center gap-1.5">
        {ILGAN_LIST.filter((i) => i.key !== c.key).map((i) => (
          <Link
            key={i.key}
            href={`/ilgan/${i.key}`}
            className="rounded-full border border-line bg-card px-3 py-1.5 text-xs transition hover:border-accent"
          >
            {i.emoji} {i.korean}
          </Link>
        ))}
      </nav>
    </div>
  );
}

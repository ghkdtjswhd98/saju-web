import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ShareBar from "@/components/ShareBar";
import { OHAENG_TYPES, TYPE_ORDER, isElementKey } from "@/lib/ohaeng-test";

export function generateStaticParams() {
  return TYPE_ORDER.map((type) => ({ type }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  if (!isElementKey(type)) return {};
  const t = OHAENG_TYPES[type];
  return {
    title: `${t.emoji} 나는 "${t.name}" — 오행 캐릭터 테스트`,
    description: `${t.tagline}. 12개 질문 1분이면 내 기운이 나와요. 너는 어떤 기운이야?`,
  };
}

export default async function OhaengResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ sub?: string }>;
}) {
  const [{ type }, { sub }] = await Promise.all([params, searchParams]);
  if (!isElementKey(type)) notFound();
  const t = OHAENG_TYPES[type];
  const subType = sub && isElementKey(sub) && sub !== type ? OHAENG_TYPES[sub] : null;
  const match = OHAENG_TYPES[t.matchKey];

  return (
    <div className="mx-auto max-w-xl px-5 py-8">
      <header className="text-center">
        <p className="text-xs tracking-widest text-ink-soft">오행 캐릭터 테스트</p>
      </header>

      {/* 결과 카드 */}
      <div
        className="mt-4 rounded-2xl border-2 bg-card p-6 text-center"
        style={{ borderColor: t.color }}
      >
        <p className="text-6xl">{t.emoji}</p>
        <p className="mt-3 text-sm font-medium" style={{ color: t.color }}>
          {t.korean}({t.hanja})의 기운
        </p>
        <h1 className="mt-1 text-2xl font-bold">{t.name}</h1>
        <p className="mt-1.5 text-sm text-ink-soft">&ldquo;{t.tagline}&rdquo;</p>
        {subType && (
          <p className="mt-3 inline-block rounded-full bg-bg px-3 py-1 text-xs text-ink-soft">
            서브 기운: {subType.emoji} {subType.korean}({subType.hanja})
          </p>
        )}
        <div className="mt-4 space-y-2.5 text-left text-sm leading-6">
          {t.description.map((d) => (
            <p key={d.slice(0, 10)}>{d}</p>
          ))}
        </div>
        <ul className="mt-4 flex justify-center gap-1.5">
          {t.strengths.map((s) => (
            <li
              key={s}
              className="rounded-full px-3 py-1 text-xs font-medium text-white"
              style={{ background: t.color }}
            >
              {s}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-card p-5 text-sm leading-6">
        <p>
          <b>🔎 의식하면 좋은 것</b>
          <br />
          {t.watchout}
        </p>
        <p className="mt-3">
          <b>
            {match.emoji} 잘 맞는 기운 — {match.name}
          </b>
          <br />
          {t.matchReason}
        </p>
      </div>

      <div className="mt-5 space-y-2">
        <ShareBar
          path={`/test/ohaeng/${t.key}`}
          title={`${t.emoji} 나는 "${t.name}"이래!`}
          description={`${t.tagline} — 너는 어떤 기운이야? 1분 테스트`}
        />
        <a
          href={`/test/ohaeng/${t.key}/story-image`}
          download={`ohaeng-${t.key}.png`}
          className="block rounded-xl border border-line bg-card px-4 py-3 text-center text-sm font-bold transition hover:border-accent"
        >
          📱 스토리용 이미지 저장 (9:16)
        </a>
      </div>

      {/* 사주 전환 CTA */}
      <section className="mt-8 rounded-2xl border-2 border-accent bg-card p-5 text-center">
        <p className="text-sm text-ink-soft">여기까지는 성향 맛보기예요</p>
        <h2 className="mt-1 text-lg font-bold leading-snug">
          태어난 순간이 정한
          <br />내 진짜 오행 비율이 궁금하다면
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          사주팔자를 만세력으로 계산하면 내 안의 목·화·토·금·수가
          <br />
          정확한 숫자로 나와요. 회원가입 없이 30초, 무료.
        </p>
        <Link
          href="/"
          className="mt-4 block rounded-xl bg-accent-strong px-4 py-3.5 text-[15px] font-bold text-white transition hover:opacity-90"
        >
          내 진짜 오행 무료로 확인하기 →
        </Link>
      </section>

      <div className="mt-6 text-center">
        <Link href="/test/ohaeng" className="text-sm text-accent-strong hover:underline">
          나도 테스트하기 →
        </Link>
      </div>
    </div>
  );
}

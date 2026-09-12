import type { Metadata } from "next";
import ChemiCreateForm from "@/components/chemi/ChemiCreateForm";

export const metadata: Metadata = {
  title: "친구 케미 순위 — 친구 중 누가 나랑 제일 잘 맞을까?",
  description:
    "내 링크를 보내면 친구는 생일만 넣어요. 누가 나랑 제일 잘 맞는지 케미 순위가 쌓여요. 회원가입·로그인 없음.",
};

const STEPS = [
  { n: "1", title: "별명과 생일로 내 링크 만들기", desc: "10초면 돼요. 생년월일은 저장하지 않아요." },
  { n: "2", title: "단톡방·스토리에 링크 올리기", desc: "친구는 로그인 없이 생일만 넣어요." },
  { n: "3", title: "케미 순위판이 쌓여요", desc: "누가 나랑 제일 잘 맞는지 한눈에." },
];

export default function ChemiPage() {
  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <header className="text-center">
        <p className="text-sm font-medium text-accent-strong">친구 케미 순위</p>
        <h1 className="mt-2 text-2xl font-bold leading-snug">
          친구 중 누가
          <br />
          나랑 제일 잘 맞을까?
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          내 링크 하나면 친구들 케미 점수가 순위로 쌓여요
        </p>
      </header>

      <div className="mt-7">
        <ChemiCreateForm />
      </div>

      <ol className="mt-8 space-y-3">
        {STEPS.map((s) => (
          <li key={s.n} className="flex items-start gap-3 rounded-2xl border border-line bg-card px-4 py-3.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-strong">
              {s.n}
            </span>
            <div>
              <p className="text-sm font-bold text-ink">{s.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-ink-soft">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-6 text-center text-xs leading-5 text-ink-soft">
        점수는 두 사주의 지지 관계와 오행 보완도로 계산한 결정론적 값이에요.
        <br />
        모든 결과는 긍정 문구로만 나와요 — 꼴찌도 웃고 넘길 수 있게.
      </p>
    </div>
  );
}

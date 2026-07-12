// 계산 결과 시각화 — 팔자표 / 오행 차트 / 별점 프로필 (서버 컴포넌트에서 사용 가능)
import type { RatingKey, SajuResult } from "@/lib/saju/types";

const EL_COLOR: Record<string, string> = {
  목: "var(--color-el-wood)",
  화: "var(--color-el-fire)",
  토: "var(--color-el-earth)",
  금: "var(--color-el-metal)",
  수: "var(--color-el-water)",
};

export function PillarTable({ saju }: { saju: SajuResult }) {
  const cols = [
    { label: "시주", p: saju.pillars.hour },
    { label: "일주", p: saju.pillars.day },
    { label: "월주", p: saju.pillars.month },
    { label: "년주", p: saju.pillars.year },
  ];
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h3 className="mb-3 text-sm font-bold tracking-widest text-accent-strong">사주팔자</h3>
      <div className="grid grid-cols-4 gap-2 text-center">
        {cols.map((c) => (
          <div key={c.label} className="rounded-xl bg-bg py-3">
            <div className="text-[11px] text-ink-soft">{c.label}</div>
            <div className="mt-1 text-2xl font-bold">{c.p ? c.p.hangul : "미상"}</div>
            <div className="text-xs text-ink-soft">{c.p ? c.p.hanja : "―"}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-soft">
        일간(나) <b className="text-ink">{saju.dayMaster.char}</b> · {saju.dayMaster.yinyang}
        {saju.dayMaster.element} — 만세력 데이터로 정확히 계산된 값이에요.
      </p>
    </div>
  );
}

export function ElementChart({ saju }: { saju: SajuResult }) {
  const max = Math.max(...saju.elementDist.map((e) => e.count), 3);
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h3 className="mb-3 text-sm font-bold tracking-widest text-accent-strong">오행 밸런스</h3>
      <div className="space-y-2">
        {saju.elementDist.map((e) => (
          <div key={e.name} className="flex items-center gap-3">
            <span className="w-5 text-sm font-bold">{e.name}</span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-bg">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min((e.count / max) * 100, 100)}%`, background: EL_COLOR[e.name] }}
              />
            </div>
            <span className="w-8 text-right text-xs text-ink-soft">{e.count.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const RATING_KEYS: RatingKey[] = ["매력도", "재물운", "돌파력", "낭만력", "마이웨이"];

export function StarProfile({ saju }: { saju: SajuResult }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h3 className="mb-3 text-sm font-bold tracking-widest text-accent-strong">사주 프로필</h3>
      <div className="space-y-1.5">
        {RATING_KEYS.map((k) => (
          <div key={k} className="flex items-center justify-between">
            <span className="text-sm">{k}</span>
            <span className="text-sm tracking-wider" aria-label={`${saju.ratings.starsNum[k]}점`}>
              {"★".repeat(saju.ratings.starsNum[k])}
              <span className="text-line">{"★".repeat(5 - saju.ratings.starsNum[k])}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

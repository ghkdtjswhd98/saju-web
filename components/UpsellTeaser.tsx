// 무료 결과 하단 유료 전환 티저 — 잠긴 섹션 미리보기 + 상품 목록
import Link from "next/link";
import { PRODUCTS } from "@/lib/products";

// 유료 리포트에서 실제로 다루는 주제를 "잠긴 상태"로 보여준다 (내용 과장 없이 목차 기반)
const LOCKED_PREVIEWS = [
  { title: "올해의 흐름", hint: "기회가 쏟아지는 시기와 조심할 시기가 언제인지" },
  { title: "속마음 리딩", hint: "겉모습 뒤에 숨겨둔 당신의 가장 내밀한 결" },
  { title: "재물의 그릇", hint: "돈이 들어오는 방식과 새는 패턴" },
  { title: "관계의 패턴", hint: "연애에서 반복되는 끌림과 갈등의 이유" },
];

export default function UpsellTeaser({ fromShareId }: { fromShareId: string }) {
  return (
    <section className="mt-8">
      {/* 잠긴 섹션 티저 */}
      <div className="space-y-2">
        {LOCKED_PREVIEWS.map((s) => (
          <div
            key={s.title}
            className="relative overflow-hidden rounded-2xl border border-line bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-widest text-ink-soft">{s.title}</h3>
              <span aria-hidden className="text-ink-soft">🔒</span>
            </div>
            <p className="mt-2 select-none text-[15px] leading-7 text-ink-soft blur-[5px]">
              {s.hint}. 그 답은 심층 리포트에서 확인할 수 있어요. 여기엔 당신의 사주에서만
              나오는 구체적인 이야기가 담겨요.
            </p>
            <p className="mt-1 text-xs text-ink-soft">{s.hint} — 심층 리포트에서 열려요</p>
          </div>
        ))}
      </div>

      {/* 상품 선택 */}
      <div className="mt-5 rounded-2xl border-2 border-accent bg-card p-5 text-center">
        <h2 className="text-lg font-bold leading-snug">심층 리포트로 전부 열어보기</h2>
        <p className="mt-1 text-xs text-ink-soft">
          결제 즉시 생성 · 링크로 영구 보관 · 입력 정보 그대로 이어져요
        </p>
        <div className="mt-4 space-y-2">
          {Object.values(PRODUCTS).map((p) => {
            const recommended = p.code === "lifetime";
            return (
              <Link
                key={p.code}
                href={`/checkout/new?product=${p.code}&from=${fromShareId}`}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition hover:border-accent ${
                  recommended ? "border-accent bg-accent-soft/40" : "border-line bg-bg"
                }`}
              >
                <span>
                  <span className="block text-[15px] font-bold">
                    {p.name}
                    {recommended && (
                      <span className="ml-1.5 rounded-full bg-accent-strong px-2 py-0.5 align-middle text-[10px] font-bold text-white">
                        가장 많이 선택
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-ink-soft">{p.tagline}</span>
                </span>
                <span className="ml-3 shrink-0 text-sm font-bold text-accent-strong">
                  {p.price.toLocaleString()}원
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

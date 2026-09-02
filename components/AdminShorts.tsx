"use client";

// 숏폼 대본 딸깍 생성 탭 — 강의의 "AI 쇼츠 딸깍" UI 벤치마킹 (우리는 대본까지, 영상은 CapCut).
import { useState } from "react";
import { PRODUCTS, type ProductCode } from "@/lib/products";

const TTIS = [
  { key: "rat", name: "쥐띠", emoji: "🐀" }, { key: "ox", name: "소띠", emoji: "🐂" },
  { key: "tiger", name: "호랑이띠", emoji: "🐅" }, { key: "rabbit", name: "토끼띠", emoji: "🐇" },
  { key: "dragon", name: "용띠", emoji: "🐉" }, { key: "snake", name: "뱀띠", emoji: "🐍" },
  { key: "horse", name: "말띠", emoji: "🐎" }, { key: "sheep", name: "양띠", emoji: "🐑" },
  { key: "monkey", name: "원숭이띠", emoji: "🐒" }, { key: "rooster", name: "닭띠", emoji: "🐓" },
  { key: "dog", name: "개띠", emoji: "🐕" }, { key: "pig", name: "돼지띠", emoji: "🐖" },
];

interface Result { key: string; tti: string; emoji: string; markdown: string }

export default function AdminShorts({ adminKey }: { adminKey: string }) {
  const [selected, setSelected] = useState<string[]>(["dog", "rat"]);
  const [productCode, setProductCode] = useState<ProductCode>("year");
  const [tone, setTone] = useState("dosa");
  const [busy, setBusy] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState("");

  const toggle = (key: string) =>
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));

  async function generate() {
    if (!selected.length || busy) return;
    setError("");
    setResults([]);
    for (const key of selected) {
      const tti = TTIS.find((t) => t.key === key)!;
      setBusy(`${tti.emoji} ${tti.name} 대본 쓰는 중…`);
      try {
        const res = await fetch("/api/admin/shorts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ adminKey, ttiKey: key, productCode, tone }),
        });
        const json = (await res.json()) as Result & { error?: string };
        if (!res.ok) {
          setError(`${tti.name}: ${json.error ?? "실패"}`);
          continue;
        }
        setResults((r) => [...r, { ...json, key }]);
      } catch {
        setError(`${tti.name}: 네트워크 오류`);
      }
    }
    setBusy(null);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-card p-4">
        <p className="text-xs font-bold text-ink-soft">띠 선택 (여러 개 가능)</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TTIS.map((t) => (
            <button
              key={t.key}
              onClick={() => toggle(t.key)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                selected.includes(t.key)
                  ? "border-accent bg-accent-soft/60 font-bold text-accent-strong"
                  : "border-line bg-bg"
              }`}
            >
              {t.emoji} {t.name}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <select
            value={productCode}
            onChange={(e) => setProductCode(e.target.value as ProductCode)}
            className="rounded-xl border border-line bg-bg px-3 py-2 text-sm"
          >
            {Object.values(PRODUCTS).filter((p) => p.code !== "bundle").map((p) => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="rounded-xl border border-line bg-bg px-3 py-2 text-sm"
          >
            <option value="dosa">도사 반말</option>
            <option value="eonni">친한 언니</option>
          </select>
          <button
            onClick={generate}
            disabled={Boolean(busy) || !selected.length}
            className="rounded-xl bg-accent-strong px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            {busy ?? `대본 ${selected.length}개 생성`}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>

      {results.map((r) => (
        <details key={r.key} open className="rounded-2xl border border-line bg-card p-4">
          <summary className="cursor-pointer text-sm font-bold">
            {r.emoji} {r.tti}
            <button
              onClick={(e) => {
                e.preventDefault();
                navigator.clipboard.writeText(r.markdown);
              }}
              className="ml-2 rounded-full border border-line px-2 py-0.5 text-xs"
            >
              전체 복사
            </button>
          </summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs leading-5">{r.markdown}</pre>
        </details>
      ))}
    </div>
  );
}

"use client";

// 일괄 발급·발송 탭 — 강의 워크플로("밤에 엑셀 한 번 정리하면 끝 → 전송")의 우리 버전.
// 엑셀에서 복붙한 행들을 검증 → 리포트 일괄 발급 → 이메일 자동 발송(링크 → 열람 시 생성 → PDF 메일).
import { useMemo, useState } from "react";
import { PRODUCTS, type ProductCode } from "@/lib/products";

interface Row {
  raw: string;
  name?: string;
  gender?: string;
  year?: number;
  month?: number;
  day?: number;
  hourValue?: string;
  email?: string;
  isLunar?: boolean;
  error?: string;
}

const HOUR_SET = new Set(["unknown", "0", "2", "4", "6", "8", "10", "12", "14", "16", "18", "20", "22", "23"]);

function parseRow(raw: string): Row {
  const parts = raw.split(/[,\t]/).map((s) => s.trim());
  if (parts.length < 3) return { raw, error: "형식: 이름,성별,생년월일[,시간][,이메일][,음력]" };
  const [name, gender, birth, ...rest] = parts;
  if (gender !== "남" && gender !== "여") return { raw, error: "성별은 남/여" };
  const bm = birth.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/);
  if (!bm) return { raw, error: "생년월일은 1996-11-23 형식" };
  const row: Row = {
    raw, name, gender,
    year: Number(bm[1]), month: Number(bm[2]), day: Number(bm[3]),
    hourValue: "unknown", isLunar: false,
  };
  for (const token of rest) {
    if (!token) continue;
    if (token === "음력") row.isLunar = true;
    else if (token.includes("@")) row.email = token;
    else if (token === "모름") row.hourValue = "unknown";
    else if (HOUR_SET.has(token)) row.hourValue = token;
    else if (/^\d{1,2}시$/.test(token)) {
      // "14시" → 가장 가까운 시진 슬롯 (짝수)
      const h = Number(token.replace("시", ""));
      const slot = h === 23 ? "23" : String(Math.floor(h / 2) * 2);
      row.hourValue = HOUR_SET.has(slot) ? slot : "unknown";
    } else return { raw, error: `알 수 없는 값: ${token}` };
  }
  return row;
}

interface SendResult { name: string; ok: boolean; token?: string; emailed?: boolean; error?: string }

export default function AdminBulkSend({ adminKey }: { adminKey: string }) {
  const [text, setText] = useState("");
  const [productCode, setProductCode] = useState<ProductCode>("lifetime");
  const [kind, setKind] = useState<"tester" | "paid">("tester");
  const [channel, setChannel] = useState("당근");
  const [busy, setBusy] = useState<string | null>(null);
  const [results, setResults] = useState<SendResult[]>([]);

  const rows = useMemo(
    () => text.split("\n").map((l) => l.trim()).filter(Boolean).map(parseRow),
    [text],
  );
  const valid = rows.filter((r) => !r.error);
  const product = PRODUCTS[productCode];

  async function send() {
    if (busy || !valid.length) return;
    setResults([]);
    let i = 0;
    for (const r of valid) {
      i++;
      setBusy(`발급 중 ${i}/${valid.length} — ${r.name}`);
      try {
        const res = await fetch("/api/admin", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "issue",
            adminKey,
            productCode,
            kind,
            channel,
            email: r.email ?? "",
            persons: [{
              name: r.name, gender: r.gender, year: r.year, month: r.month, day: r.day,
              hourValue: r.hourValue, isLunar: r.isLunar, isLeap: false,
            }],
          }),
        });
        const json = (await res.json()) as { tokens?: string[]; emailed?: boolean; error?: string };
        if (!res.ok || !json.tokens?.length) {
          setResults((s) => [...s, { name: r.name!, ok: false, error: json.error ?? "실패" }]);
        } else {
          setResults((s) => [...s, { name: r.name!, ok: true, token: json.tokens![0], emailed: json.emailed }]);
        }
      } catch {
        setResults((s) => [...s, { name: r.name!, ok: false, error: "네트워크 오류" }]);
      }
    }
    setBusy(null);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-card p-4">
        <p className="text-xs font-bold text-ink-soft">
          엑셀에서 복붙 — 한 줄에 한 명: <code>이름,성별,생년월일[,시간][,이메일][,음력]</code>
        </p>
        <p className="mt-1 text-[11px] text-ink-soft">
          예: 지민,여,1996-11-23,14시,jimin@naver.com · 시간 모르면 비우거나 &quot;모름&quot;
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder={"지민,여,1996-11-23,14시,jimin@naver.com\n준호,남,1994-04-02,모름"}
          className="mt-2 w-full rounded-xl border border-line bg-bg px-3 py-2 font-mono text-xs"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select value={productCode} onChange={(e) => setProductCode(e.target.value as ProductCode)}
            className="rounded-xl border border-line bg-bg px-3 py-2 text-sm">
            {Object.values(PRODUCTS).filter((p) => p.personCount === 1).map((p) => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
          <select value={kind} onChange={(e) => setKind(e.target.value as "tester" | "paid")}
            className="rounded-xl border border-line bg-bg px-3 py-2 text-sm">
            <option value="tester">체험단 (무상)</option>
            <option value="paid">실판매 (수동 결제)</option>
          </select>
          <input value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="채널"
            className="w-20 rounded-xl border border-line bg-bg px-3 py-2 text-sm" />
          <button
            onClick={send}
            disabled={Boolean(busy) || !valid.length}
            className="rounded-xl bg-accent-strong px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            {busy ?? `${valid.length}명 발급${valid.some((r) => r.email) ? "+메일 발송" : ""}`}
          </button>
        </div>
        {rows.some((r) => r.error) && (
          <div className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
            {rows.filter((r) => r.error).map((r, i) => (
              <p key={i}>✗ {r.raw.slice(0, 40)} — {r.error}</p>
            ))}
          </div>
        )}
        <p className="mt-2 text-[11px] leading-4 text-ink-soft">
          이메일이 있는 행은 발급 즉시 <b>리포트 링크 메일</b>이 나가고, 고객이 열면 생성 →
          완성되면 <b>PDF가 자동 첨부 발송</b>돼요 (2인 상품은 개별 발급 탭 이용).
          ⚠️ 구매·문의 이력이 없는 사람에게 광고성 메시지를 보내는 건 정보통신망법상 사전
          수신동의가 필요해요 — 이 탭은 <b>주문·문의받은 고객에게 상품을 전달</b>하는 용도입니다.
        </p>
      </div>

      {results.length > 0 && (
        <div className="rounded-2xl border border-line bg-card p-4 text-sm">
          <p className="font-bold">
            결과: 성공 {results.filter((r) => r.ok).length} / 실패 {results.filter((r) => !r.ok).length}
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            {results.map((r, i) => (
              <li key={i}>
                {r.ok ? "✅" : "❌"} {r.name}
                {r.token && (
                  <>
                    {" — "}
                    <a href={`/report/${r.token}`} target="_blank" className="text-accent-strong underline">
                      링크
                    </a>
                    {r.emailed ? " · 메일 발송됨" : " · 메일 없음(링크 직접 전달)"}
                  </>
                )}
                {r.error && ` — ${r.error}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

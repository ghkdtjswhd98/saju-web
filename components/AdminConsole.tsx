"use client";

import { useEffect, useState } from "react";
import PersonFields, { EMPTY_PERSON, personToApiInput, type PersonFormValue } from "./PersonFields";
import { getProduct, PRODUCTS, type ProductCode } from "@/lib/products";

type Issued = { token: string; productCode: string; status: string };

const KEY_STORAGE = "orobmi_admin_key";

// 당근 등 채팅 판매용 운영자 콘솔 — 정보 입력 → 발급 → 생성 → PDF까지 한 화면에서.
// 응대 속도가 곧 전환율이라 단계를 최소화했다.
export default function AdminConsole() {
  const [adminKey, setAdminKey] = useState("");
  const [productCode, setProductCode] = useState<ProductCode>("lifetime");
  const [kind, setKind] = useState<"paid" | "tester">("paid");
  const [channel, setChannel] = useState("당근");
  const [amount, setAmount] = useState("");
  const [persons, setPersons] = useState<PersonFormValue[]>([EMPTY_PERSON]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<Issued[]>([]);
  const [recent, setRecent] = useState<
    { token: string; name: string; productCode: string; status: string; isPaid: boolean }[]
  >([]);

  const product = PRODUCTS[productCode];
  const personCount = product?.personCount ?? 1;

  useEffect(() => {
    try {
      const k = localStorage.getItem(KEY_STORAGE);
      if (k) setAdminKey(k);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setPersons((arr) => {
      if (arr.length === personCount) return arr;
      return Array.from({ length: personCount }, (_, i) => arr[i] ?? { ...EMPTY_PERSON, gender: "남" });
    });
  }, [personCount]);

  function saveKey(k: string) {
    setAdminKey(k);
    try {
      localStorage.setItem(KEY_STORAGE, k);
    } catch {
      /* ignore */
    }
  }

  async function api(body: object) {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "실패했어요.");
    return data;
  }

  async function loadRecent() {
    try {
      const data = await api({ action: "list" });
      setRecent(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "목록 조회 실패");
    }
  }

  // 발급 → 각 리포트의 생성 스트림을 순차 소비해 완료까지 기다린다
  async function issue() {
    setError("");
    setIssued([]);
    if (!persons.every((p) => p.date)) {
      setError("생년월일을 입력해주세요.");
      return;
    }
    setBusy("발급 중…");
    try {
      const data = await api({
        action: "issue",
        productCode,
        kind,
        channel,
        amount: amount ? Number(amount) : undefined,
        persons: persons.map(personToApiInput),
      });
      const tokens: string[] = data.tokens;
      setIssued(tokens.map((t) => ({ token: t, productCode, status: "생성 중" })));

      for (let i = 0; i < tokens.length; i++) {
        // 장문 상품은 서버리스 시간 제한 때문에 파트마다 요청이 나뉜다.
        // done이 될 때까지 이어서 호출해야 리포트가 완성된다.
        for (let attempt = 1; attempt <= 8; attempt++) {
          setBusy(
            `리포트 생성 중… (${i + 1}/${tokens.length})` +
              (attempt > 1 ? ` · ${attempt}번째 구간` : " · 1~2분 걸려요"),
          );
          const body = await fetch(`/api/reports/${tokens[i]}/stream`).then((r) => r.text());
          if (body.includes('"t":"done"') || body.includes('"t":"full"')) break;
          if (body.includes('"t":"error"')) throw new Error("리포트 생성에 실패했어요. 다시 시도해주세요.");
          // partial/busy면 이어서 다음 구간 호출
        }
        setIssued((arr) =>
          arr.map((x) => (x.token === tokens[i] ? { ...x, status: "완료" } : x)),
        );
      }
      setBusy(null);
      loadRecent();
    } catch (e) {
      setBusy(null);
      setError(e instanceof Error ? e.message : "발급 실패");
    }
  }

  const site = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold">운영자 콘솔</h1>
        <p className="mt-1 text-sm text-ink-soft">
          당근 채팅에서 받은 주문을 여기서 발급해요. 발급 → 생성 완료 → PDF/링크 전달.
        </p>
      </header>

      <input
        type="password"
        value={adminKey}
        onChange={(e) => saveKey(e.target.value)}
        placeholder="관리자 키 (ADMIN_KEY)"
        className="w-full rounded-xl border border-line bg-card px-3 py-2.5 text-sm outline-none focus:border-accent"
      />

      <div className="rounded-2xl border border-line bg-card p-5 space-y-4">
        <div>
          <label className="text-xs font-medium text-ink-soft">상품</label>
          <select
            value={productCode}
            onChange={(e) => setProductCode(e.target.value as ProductCode)}
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm"
          >
            {Object.values(PRODUCTS).map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          {(["paid", "tester"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                kind === k ? "border-accent bg-accent-soft/50 text-accent-strong" : "border-line bg-bg"
              }`}
            >
              {k === "paid" ? "💰 입금 완료 (실판매)" : "🎁 체험단 무상"}
            </button>
          ))}
        </div>
        <p className="-mt-2 text-xs text-ink-soft">
          {kind === "paid"
            ? "주문이 기록돼 후기에 '구매 확인됨'이 붙고 판매 카운터에 반영돼요."
            : "주문 없이 발급 — 후기에 '체험단 제공' 라벨이 자동으로 붙어요."}
        </p>

        {kind === "paid" && (
          <div className="flex gap-2">
            <input
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="유입 경로 (당근/인스타…)"
              className="flex-1 rounded-xl border border-line bg-bg px-3 py-2.5 text-sm"
            />
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="입금액 (비우면 현재가)"
              className="flex-1 rounded-xl border border-line bg-bg px-3 py-2.5 text-sm"
            />
          </div>
        )}

        {persons.map((p, i) => (
          <div key={i} className="border-t border-line pt-4">
            {personCount === 2 && (
              <p className="mb-2 text-xs font-bold text-accent-strong">
                {i === 0 ? "신청자" : "상대"}
              </p>
            )}
            <PersonFields
              value={p}
              onChange={(v) => setPersons((arr) => arr.map((x, j) => (j === i ? v : x)))}
            />
          </div>
        ))}

        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="button"
          onClick={issue}
          disabled={!!busy || !adminKey}
          className="w-full rounded-xl bg-accent-strong px-4 py-3.5 text-[15px] font-bold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ?? "발급하고 생성하기"}
        </button>
      </div>

      {issued.length > 0 && (
        <div className="rounded-2xl border-2 border-accent bg-card p-5 space-y-3">
          <h2 className="text-sm font-bold">발급 완료 — 아래를 당근 채팅에 붙여넣으세요</h2>
          {issued.map((r) => (
            <div key={r.token} className="rounded-xl bg-bg p-3 text-sm">
              <p className="font-medium">
                {getProduct(r.productCode)?.name ?? r.productCode} · {r.status}
              </p>
              <p className="mt-1 break-all text-xs text-ink-soft">{`${site}/report/${r.token}`}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(`${site}/report/${r.token}`)}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs"
                >
                  링크 복사
                </button>
                <a
                  href={`/report/${r.token}/pdf`}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs"
                >
                  PDF 받기
                </a>
              </div>
            </div>
          ))}
          <div className="rounded-xl border border-line p-3 text-xs leading-6">
            <b>채팅 발송 문구</b>
            <p className="mt-1 whitespace-pre-wrap text-ink-soft">
              {`리포트 완성됐어요! 아래 링크에서 바로 보실 수 있고, PDF로도 보내드릴게요 🌙\n${site}/report/${issued[0]?.token}\n\n다 읽으시고 페이지 맨 아래에서 별점+한 줄 후기 남겨주시면 정말 큰 힘이 돼요!`}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-line bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">최근 발급</h2>
          <button type="button" onClick={loadRecent} className="text-xs text-accent-strong">
            새로고침
          </button>
        </div>
        <div className="mt-3 space-y-1.5">
          {recent.map((r) => (
            <div key={r.token} className="flex items-center justify-between text-xs">
              <span className="truncate">
                {r.isPaid ? "💰" : "🎁"} {r.name} · {getProduct(r.productCode)?.name ?? r.productCode}
              </span>
              <span className="flex shrink-0 gap-2">
                <span className="text-ink-soft">{r.status}</span>
                <a href={`/report/${r.token}`} className="text-accent-strong">
                  열기
                </a>
                <a href={`/report/${r.token}/pdf`} className="text-accent-strong">
                  PDF
                </a>
              </span>
            </div>
          ))}
          {recent.length === 0 && <p className="text-xs text-ink-soft">새로고침을 눌러주세요.</p>}
        </div>
      </div>
    </div>
  );
}

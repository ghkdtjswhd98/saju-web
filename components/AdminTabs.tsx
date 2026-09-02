"use client";

// 운영자 콘솔 탭 래퍼 — [발급(기존)] [숏폼 대본] [일괄 발송].
// 강의 어드민("Fortune LAB 가맹점") 벤치마킹: 한 화면에서 콘텐츠 제작과 발송까지.
import { useEffect, useState } from "react";
import AdminBulkSend from "./AdminBulkSend";
import AdminConsole from "./AdminConsole";
import AdminShorts from "./AdminShorts";

const KEY_STORAGE = "orobmi_admin_key";
const TABS = [
  { key: "issue", label: "리포트 발급" },
  { key: "shorts", label: "숏폼 대본" },
  { key: "bulk", label: "일괄 발송" },
] as const;

export default function AdminTabs() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("issue");
  const [adminKey, setAdminKey] = useState("");

  useEffect(() => {
    try {
      const k = localStorage.getItem(KEY_STORAGE);
      if (k) setAdminKey(k);
    } catch { /* ignore */ }
  }, []);

  return (
    <div>
      <div className="mb-4 flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              tab === t.key
                ? "border-accent bg-accent-soft/60 font-bold text-accent-strong"
                : "border-line bg-card"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "issue" && <AdminConsole />}
      {tab !== "issue" && !adminKey && (
        <div className="rounded-2xl border border-line bg-card p-4 text-sm">
          <p className="text-ink-soft">관리자 키를 입력하세요 (발급 탭과 공유돼요)</p>
          <input
            type="password"
            onChange={(e) => {
              setAdminKey(e.target.value);
              try { localStorage.setItem(KEY_STORAGE, e.target.value); } catch { /* ignore */ }
            }}
            className="mt-2 w-full rounded-xl border border-line bg-bg px-3 py-2"
          />
        </div>
      )}
      {tab === "shorts" && adminKey && <AdminShorts adminKey={adminKey} />}
      {tab === "bulk" && adminKey && <AdminBulkSend adminKey={adminKey} />}
    </div>
  );
}

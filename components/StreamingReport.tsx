"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  token: string;
  initialStatus: string; // pending | generating | done | failed
  initialRawText: string | null;
}

interface Section {
  label: string;
  body: string;
}

// "===BLOCK1_한줄요약===" 형식 마커로 스트리밍 텍스트를 섹션 분해
function splitSections(text: string): Section[] {
  const re = /^===([^=\n]+)===[ \t]*$/gm;
  const sections: Section[] = [];
  let match: RegExpExecArray | null;
  let prev: { label: string; start: number } | null = null;
  while ((match = re.exec(text)) !== null) {
    if (prev) sections.push({ label: prev.label, body: text.slice(prev.start, match.index).trim() });
    prev = { label: match[1], start: match.index + match[0].length };
  }
  if (prev) sections.push({ label: prev.label, body: text.slice(prev.start).trim() });
  return sections;
}

function prettyLabel(token: string): string {
  const idx = token.indexOf("_");
  return idx >= 0 ? token.slice(idx + 1) : token;
}

function SectionCard({ label, body }: Section) {
  const key = prettyLabel(label);
  if (key === "한줄요약") {
    return (
      <div className="rounded-2xl border border-accent bg-accent-soft/60 p-6 text-center">
        <p className="text-xs tracking-widest text-accent-strong">한 줄 요약</p>
        <p className="mt-2 text-xl font-bold leading-snug">&ldquo;{body}&rdquo;</p>
      </div>
    );
  }
  if (key === "해시태그") {
    return (
      <div className="flex flex-wrap justify-center gap-2">
        {body.split(/\s+/).filter(Boolean).map((tag) => (
          <span key={tag} className="rounded-full bg-card border border-line px-3 py-1.5 text-sm font-medium text-accent-strong">
            {tag}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h3 className="mb-2 text-sm font-bold tracking-widest text-accent-strong">{key}</h3>
      <p className="whitespace-pre-wrap text-[15px] leading-7">{body}</p>
    </div>
  );
}

// 생성 대기 중(특히 Opus thinking 구간의 무음 시간)에 보여줄 단계 메시지
const WAIT_STAGES = [
  "만세력과 팔자 구조를 대조하는 중…",
  "오행의 균형과 흐름을 읽는 중…",
  "타고난 기질의 결을 살피는 중…",
  "당신에게만 해당하는 문장을 고르는 중…",
  "리포트를 집필하는 중… (곧 첫 문장이 나와요)",
];

function WaitIndicator() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStage((s) => Math.min(s + 1, WAIT_STAGES.length - 1)), 9000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="rounded-2xl border border-line bg-card p-6 text-center">
      <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />
      <p className="mt-3 text-sm font-medium">{WAIT_STAGES[stage]}</p>
      <p className="mt-1 text-xs text-ink-soft">보통 1~2분 정도 걸려요. 화면을 닫아도 링크로 다시 볼 수 있어요.</p>
    </div>
  );
}

export default function StreamingReport({ token, initialStatus, initialRawText }: Props) {
  const [text, setText] = useState(initialRawText ?? "");
  const [phase, setPhase] = useState<"idle" | "streaming" | "done" | "error">(
    initialStatus === "done" ? "done" : "idle",
  );
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (initialStatus === "done") return;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const connect = () => {
      if (closed) return;
      const es = new EventSource(`/api/reports/${token}/stream`);
      esRef.current = es;
      setPhase("streaming");

      es.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.t === "delta") setText((t) => t + msg.text);
          else if (msg.t === "full") setText(msg.text);
          else if (msg.t === "done") {
            closed = true;
            es.close();
            setPhase("done");
          } else if (msg.t === "busy") {
            // 다른 요청이 생성 중 — 잠시 후 재접속 (완료돼 있으면 full로 받음)
            es.close();
            retryTimer = setTimeout(connect, 4000);
          } else if (msg.t === "error") {
            closed = true;
            es.close();
            setPhase("error");
          }
        } catch {
          /* ignore malformed */
        }
      };
      es.onerror = () => {
        es.close();
        if (!closed) retryTimer = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      closed = true;
      esRef.current?.close();
      if (retryTimer) clearTimeout(retryTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, initialStatus]);

  const sections = splitSections(text);

  return (
    <div className="space-y-4">
      {sections.map((s, i) => (
        <SectionCard key={`${s.label}-${i}`} label={s.label} body={s.body} />
      ))}
      {phase === "streaming" && sections.length === 0 && <WaitIndicator />}
      {phase === "streaming" && sections.length > 0 && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-ink-soft">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
          이어서 쓰는 중…
        </div>
      )}
      {phase === "error" && (
        <div className="rounded-2xl border border-danger/40 bg-card p-5 text-center text-sm">
          <p>해석 생성 중 문제가 생겼어요.</p>
          <button
            type="button"
            onClick={() => location.reload()}
            className="mt-3 rounded-lg border border-line px-4 py-2 text-sm hover:bg-bg"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}

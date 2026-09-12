"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import PersonFields, {
  EMPTY_PERSON,
  personToApiInput,
  type PersonFieldsHandle,
  type PersonFormValue,
} from "@/components/PersonFields";
import ShareBar from "@/components/ShareBar";
import {
  CHEMI_NICKNAME_MAX, CHEMI_UTM, type ChemiBoardView, type ChemiRankRow,
} from "@/lib/saju/chemi-link";
import BoardVisibilityToggle from "./BoardVisibilityToggle";
import LockIcon from "./LockIcon";
import RankingBoard from "./RankingBoard";
import { getOwnerKey, saveOwnerKey, trackChemi } from "./chemi-client";

interface Props {
  code: string;
  nickname: string;
  /** 서버가 친구 기준으로 만든 순위판(비공개 제외·잠금 반영) */
  initialBoard: ChemiBoardView;
}

interface ReplyResult {
  score: number;
  label: string;
  rank: number;
  total: number;
  nickname: string; // 서버가 정제해 저장한 별명 — 순위판 본인 줄 강조는 이 값으로 맞춘다
  isPrivate: boolean; // 비공개로 올렸으면 결과 화면에 안내
}

/** 주인 화면 상태 — 전체 순위(비공개 포함) + 공개 토글 */
interface OwnerBoard {
  rows: ChemiRankRow[];
  total: number;
  boardPublic: boolean;
}

/** 친구 순위판(ChemiBoardView)을 RankingBoard props로 */
function boardProps(b: ChemiBoardView) {
  return b.locked
    ? { rows: [], total: b.total, locked: true, privateCount: 0 }
    : { rows: b.replies, total: b.total, locked: false, privateCount: b.privateCount };
}

// /chemi/[code] — 같은 URL이 두 얼굴을 가진다.
//   주인(이 브라우저에 ownerKey가 있음): 공유 버튼 + 공개 토글 + 전체 순위판
//   친구: "{nickname}님과 너의 케미는?" → 별명+생일(+비공개 체크) → 점수·라벨·순위 → "나도 내 링크 만들기"
// 성별은 묻지 않는다 — 케미는 지지·오행만 쓰고, 안내 문구("생일만")와 실제 입력이 같아야 한다
export default function ChemiLanding({ code, nickname, initialBoard }: Props) {
  const router = useRouter();
  // 링크를 막 만든 주인은 ?me=1로 들어온다 — 첫 프레임부터 순위판을 그려 친구 폼이 깜빡이지 않게.
  // 진짜 주인인지는 아래 useEffect에서 localStorage 키 + 서버 확인으로 다시 가리고, 아니면 친구 화면으로 바꾼다.
  const isMe = useSearchParams().get("me") === "1";
  const [mode, setMode] = useState<"owner" | "friend">(isMe ? "owner" : "friend");
  const [board, setBoard] = useState<ChemiBoardView>(initialBoard);
  // 주인 전체 순위는 서버 확인 뒤에 온다 — 그전엔 친구용 순위판을 임시로 보여준다
  const [owner, setOwner] = useState<OwnerBoard>(() => ({
    rows: initialBoard.locked ? [] : initialBoard.replies,
    total: initialBoard.total,
    boardPublic: !initialBoard.locked,
  }));
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [person, setPerson] = useState<PersonFormValue>(EMPTY_PERSON);
  const [isPrivate, setIsPrivate] = useState(false);
  const fieldsRef = useRef<PersonFieldsHandle>(null);
  const [result, setResult] = useState<ReplyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regenError, setRegenError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    trackChemi("chemi_visit", { campaign: params.get("utm_campaign") ?? "direct" });
    const key = getOwnerKey(code);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 1회 localStorage 판독(주인/친구 분기), 캐스케이드 없음
    setMode(key ? "owner" : "friend");
    if (!key) return;
    // 주인 — 서버가 키를 확인해야 전체 순위를 준다 (키가 오래돼 안 맞으면 친구 화면으로)
    let cancelled = false;
    fetch(`/api/chemi/links/${code}`, { headers: { "x-owner-key": key } })
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          d: { isOwner?: boolean; replies?: ChemiRankRow[]; total?: number; boardPublic?: boolean } | null,
        ) => {
          if (cancelled) return;
          if (d?.isOwner && d.replies) {
            setOwner({ rows: d.replies, total: d.total ?? d.replies.length, boardPublic: d.boardPublic !== false });
          } else {
            setMode("friend");
          }
        },
      )
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function refreshPublicRanking() {
    try {
      const r = await fetch(`/api/chemi/links/${code}`);
      if (!r.ok) return;
      const d = (await r.json()) as ChemiBoardView;
      setBoard(d);
    } catch {
      /* 순위판 갱신 실패는 결과 표시에 영향 없음 */
    }
  }

  // 주인 토글 — 화면은 즉시 바꾸고 PATCH가 실패하면 되돌린다
  async function changeBoardPublic(next: boolean) {
    const key = getOwnerKey(code);
    if (!key || toggling) return;
    const prev = owner.boardPublic;
    setOwner((o) => ({ ...o, boardPublic: next }));
    setToggleError(null);
    setToggling(true);
    try {
      const r = await fetch(`/api/chemi/links/${code}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-owner-key": key },
        body: JSON.stringify({ boardPublic: next }),
      });
      if (!r.ok) throw new Error(String(r.status));
      trackChemi("chemi_board_toggle", { public: next });
    } catch {
      setOwner((o) => ({ ...o, boardPublic: prev }));
      setToggleError("저장이 안 됐어요. 잠시 후 다시 눌러주세요.");
    } finally {
      setToggling(false);
    }
  }

  function validate(): string | null {
    if (!person.name.trim()) return "순위판에 보일 별명을 먼저 적어주세요.";
    const res = fieldsRef.current?.focusFirstMissing();
    if (!res?.missing) return null;
    // 아직 안 열린 질문이면 열어주는 것 자체가 안내
    if (!res.wasVisible) return "";
    return "생년월일을 입력해주세요.";
  }

  async function submit() {
    const v = validate();
    if (v !== null) {
      setError(v || null);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const r = await fetch(`/api/chemi/links/${code}/replies`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ person: personToApiInput(person), nickname: person.name.trim(), isPrivate }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? "잠시 후 다시 시도해주세요.");
        return;
      }
      setResult({ ...(data as ReplyResult), isPrivate: data.isPrivate === true });
      trackChemi("chemi_reply", { private: isPrivate });
      window.scrollTo({ top: 0, behavior: "smooth" });
      await refreshPublicRanking();
    } catch {
      setError("네트워크 오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  // "나도 내 링크 만들기" — 방금 넣은 생일을 그대로 써서 재입력 없이 즉시 생성
  async function makeMine() {
    setRegenLoading(true);
    setRegenError(null);
    try {
      const r = await fetch("/api/chemi/links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ person: personToApiInput(person), nickname: person.name.trim() }),
      });
      const data = await r.json();
      if (!r.ok) {
        setRegenError(data.error ?? "잠시 후 다시 시도해주세요.");
        return;
      }
      saveOwnerKey(data.code, data.ownerKey);
      trackChemi("chemi_regen", { from: code });
      router.push(`/chemi/${data.code}?me=1`);
    } catch {
      setRegenError("네트워크 오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setRegenLoading(false);
    }
  }

  const sharePath = `/chemi/${code}?${CHEMI_UTM}`;

  if (mode === "owner") {
    const privateCount = owner.rows.filter((r) => r.isPrivate).length;
    return (
      <div className="space-y-5">
        <header className="text-center">
          <p className="text-sm font-medium text-accent-strong">내 케미 순위판</p>
          <h1 className="mt-2 text-2xl font-bold leading-snug">
            {nickname}님과
            <br />
            제일 잘 맞는 친구는?
          </h1>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            링크를 보내면 친구는 생일만 넣어요
            <br />
            답할 때마다 여기에 순위가 쌓여요
          </p>
        </header>

        <div className="rounded-2xl border border-line bg-card p-4">
          <ShareBar
            path={sharePath}
            imagePath={`/chemi/${code}/opengraph-image`}
            title={`${nickname}님이 케미를 물어봤어요`}
            description="생일만 넣으면 나와요 — 로그인 없이 10초"
            buttonLabel="내 케미 보기"
          />
          <p className="mt-2 text-center text-xs text-ink-soft">단톡방·인스타 스토리에 한 번만 올려도 돼요</p>
        </div>

        <div>
          <BoardVisibilityToggle isPublic={owner.boardPublic} disabled={toggling} onChange={changeBoardPublic} />
          {toggleError && (
            <p role="alert" className="mt-1.5 text-center text-xs text-danger">
              {toggleError}
            </p>
          )}
        </div>

        <section>
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h2 className="text-sm font-bold text-ink">케미 순위</h2>
            {owner.total > 0 && (
              <p className="text-xs text-ink-soft">
                {owner.total}명 참여{privateCount > 0 && ` · 비공개 ${privateCount}명`}
              </p>
            )}
          </div>
          <RankingBoard rows={owner.rows} total={owner.total} />
        </section>

        <p className="text-center text-xs leading-5 text-ink-soft">
          이 순위판은 이 브라우저에서만 전체가 보여요
          <br />
          {owner.boardPublic ? "친구에게는 상위 5명까지 보여요" : "지금은 친구에게 순위판이 보이지 않아요 · 초대와 검사는 그대로 돼요"}
        </p>
        <div className="text-center">
          <Link
            href="/chemi"
            className="inline-flex min-h-11 items-center px-2 text-sm text-accent-strong hover:underline"
          >
            다른 별명으로 새 링크 만들기 →
          </Link>
        </div>
      </div>
    );
  }

  if (result) {
    const myNick = result.nickname;
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border-2 border-accent bg-card p-6 text-center">
          <p className="text-xs tracking-widest text-accent-strong">
            {nickname} × {myNick}
          </p>
          <p className="mt-1 text-6xl font-bold text-accent-strong">{result.score}</p>
          <p className="mt-2 text-base font-bold text-ink">{result.label}</p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent-soft/60 px-3 py-1 text-sm font-bold text-accent-strong">
            현재 {result.rank}위
            <span className="font-normal text-ink-soft">/ 총 {result.total}명</span>
          </p>
          {result.isPrivate && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-ink-soft">
              <LockIcon size={12} className="text-accent-strong" />
              조용히 올렸어요 — 링크 주인에게만 보여요
            </p>
          )}
          <p className="mt-3 text-[11px] leading-4 text-ink-soft">
            두 사주의 지지 관계(합·충)와 오행 보완도로 계산한 결정론적 점수예요
          </p>
        </div>

        <section>
          <h2 className="mb-2 px-1 text-sm font-bold text-ink">{nickname}님의 케미 순위</h2>
          <RankingBoard {...boardProps(board)} highlight={myNick} />
        </section>

        <section className="rounded-2xl border border-line bg-card p-5 text-center">
          <h2 className="text-lg font-bold leading-snug">
            친구 중 누가
            <br />
            나랑 제일 잘 맞을까?
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            방금 넣은 생일로 내 링크가 바로 만들어져요
            <br />
            보내기만 하면 내 순위판이 쌓여요
          </p>
          <button
            type="button"
            onClick={makeMine}
            disabled={regenLoading}
            className="mt-4 min-h-12 w-full rounded-xl bg-accent-strong px-4 py-3.5 text-[15px] font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {regenLoading ? "링크 만드는 중..." : "나도 내 링크 만들기"}
          </button>
          {regenError && (
            <p role="alert" className="mt-2 text-xs text-danger">
              {regenError}
            </p>
          )}
        </section>

        <div className="text-center">
          <Link href="/" className="inline-flex min-h-11 items-center px-2 text-sm text-accent-strong hover:underline">
            내 사주도 무료로 보기 →
          </Link>
        </div>
      </div>
    );
  }

  // 친구 랜딩 (mode === "friend")
  return (
    <div className="space-y-5">
      <header className="text-center">
        <p className="text-sm font-medium text-accent-strong">친구 케미 초대</p>
        <h1 className="mt-2 text-2xl font-bold leading-snug">
          {nickname}님과
          <br />
          너의 케미는?
        </h1>
        <p className="mt-2 text-sm text-ink-soft">별명이랑 생일만 넣으면 바로 나와요 · 로그인 없음</p>
      </header>

      <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
        <PersonFields
          ref={fieldsRef}
          value={person}
          onChange={setPerson}
          namePlaceholder="별명 (필수 · 순위판에 보여요)"
          nameMaxLength={CHEMI_NICKNAME_MAX}
          withGender={false}
        />
        <label className="mt-4 flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-line px-3 py-2.5">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent-strong)]"
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-ink">내 결과는 링크 주인에게만 보여주기</span>
            <span className="mt-0.5 block text-xs leading-5 text-ink-soft">
              체크하면 다른 친구들 순위판엔 &apos;비공개 1명&apos;으로만 보여요
            </span>
          </span>
        </label>
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="mt-5 min-h-12 w-full rounded-xl bg-accent-strong px-4 py-3.5 text-[15px] font-bold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "계산 중..." : `${nickname}님과 내 케미 보기`}
        </button>
        <p className="mt-2 text-center text-xs text-ink-soft">생년월일은 저장하지 않아요 · 점수와 별명만 남아요</p>
      </div>

      <section>
        <div className="mb-2 flex items-baseline justify-between px-1">
          <h2 className="text-sm font-bold text-ink">지금까지의 순위</h2>
          {board.total > 0 && <p className="text-xs text-ink-soft">{board.total}명 참여</p>}
        </div>
        <RankingBoard {...boardProps(board)} emptyText="아직 아무도 답하지 않았어요 — 첫 번째가 되어보세요" />
      </section>
    </div>
  );
}

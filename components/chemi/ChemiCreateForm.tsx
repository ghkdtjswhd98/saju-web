"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import PersonFields, {
  EMPTY_PERSON,
  personToApiInput,
  type PersonFieldsHandle,
  type PersonFormValue,
} from "@/components/PersonFields";
import { CHEMI_NICKNAME_MAX } from "@/lib/saju/chemi-link";
import { getMyCode, saveOwnerKey, trackChemi } from "./chemi-client";

// /chemi — 내 케미 초대 링크 만들기. 별명은 필수(친구 랜딩에 "{별명}님과 너의 케미는?"으로 보인다)
// 성별은 묻지 않는다 — 케미는 지지·오행만 쓰고, 안내 문구("생일만")와 실제 입력이 같아야 한다
export default function ChemiCreateForm() {
  const router = useRouter();
  const [person, setPerson] = useState<PersonFormValue>(EMPTY_PERSON);
  const fieldsRef = useRef<PersonFieldsHandle>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myCode, setMyCode] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 1회 localStorage 읽기(외부 시스템 동기화), 캐스케이드 없음
    setMyCode(getMyCode());
  }, []);

  async function submit() {
    const nickname = person.name.trim();
    if (!nickname) {
      setError("친구에게 보일 별명을 먼저 적어주세요.");
      return;
    }
    const res = fieldsRef.current?.focusFirstMissing();
    if (res?.missing) {
      // 아직 안 열린 질문이면 열어주는 것 자체가 안내 — 에러 문구는 열려 있는데 비었을 때만
      setError(res.wasVisible ? "생년월일을 입력해주세요." : null);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/chemi/links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ person: personToApiInput(person), nickname }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? "잠시 후 다시 시도해주세요.");
        return;
      }
      saveOwnerKey(data.code, data.ownerKey);
      trackChemi("chemi_create", { source: "chemi" });
      router.push(`/chemi/${data.code}?me=1`);
    } catch {
      setError("네트워크 오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
      {myCode && (
        <Link
          href={`/chemi/${myCode}?me=1`}
          className="mb-4 flex min-h-11 items-center justify-between rounded-xl border border-accent bg-accent-soft/40 px-4 text-sm font-bold text-accent-strong"
        >
          <span>이미 만든 내 링크 순위판 보기</span>
          <span aria-hidden="true">→</span>
        </Link>
      )}
      <PersonFields
        ref={fieldsRef}
        value={person}
        onChange={setPerson}
        namePlaceholder="별명 (필수 · 친구에게 이 이름으로 보여요)"
        nameMaxLength={CHEMI_NICKNAME_MAX}
        withGender={false}
      />
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="mt-5 min-h-12 w-full rounded-xl bg-[#272132] px-4 py-3.5 text-[15px] font-bold text-[#FFE9A8] transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "링크 만드는 중..." : "내 케미 링크 만들기"}
      </button>
      <p className="mt-2 text-center text-xs text-ink-soft">
        회원가입 없음 · 생년월일은 저장하지 않아요
      </p>
    </div>
  );
}

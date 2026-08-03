import type { Metadata } from "next";
import OhaengQuiz from "@/components/OhaengQuiz";

export const metadata: Metadata = {
  title: "오행 캐릭터 테스트 — 나는 어떤 기운으로 사는 사람일까?",
  description:
    "12개 질문 1분이면 끝. 목·화·토·금·수 다섯 기운 중 나를 움직이는 기운을 찾아보세요. 회원가입 없는 무료 테스트.",
};

export default function OhaengTestPage() {
  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <header className="text-center">
        <p className="text-sm font-medium text-accent-strong">무료 1분 테스트</p>
        <h1 className="mt-2 text-2xl font-bold leading-snug">
          나는 어떤 기운으로
          <br />
          사는 사람일까?
        </h1>
      </header>
      <div className="mt-7">
        <OhaengQuiz />
      </div>
      <p className="mt-6 text-center text-xs leading-5 text-ink-soft">
        이 테스트는 성향 기반 재미 콘텐츠예요.
        <br />
        태어난 순간이 정한 진짜 오행 비율은{" "}
        <a href="/" className="text-accent-strong underline">
          무료 사주
        </a>
        에서 30초면 나와요.
      </p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

interface KakaoSdk {
  isInitialized: () => boolean;
  init: (key: string) => void;
  Share: {
    sendDefault: (opts: object) => void;
  };
}

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

const KAKAO_SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";

interface Props {
  path: string; // 공유할 경로 (예: /free/abc)
  title: string;
  description: string;
}

export default function ShareBar({ path, title, description }: Props) {
  const [copied, setCopied] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);
  const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

  useEffect(() => {
    if (!jsKey) return;
    const ensureInit = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) window.Kakao.init(jsKey);
      if (window.Kakao?.isInitialized()) setKakaoReady(true);
    };
    if (window.Kakao) {
      ensureInit();
      return;
    }
    const script = document.createElement("script");
    script.src = KAKAO_SDK_URL;
    script.async = true;
    script.onload = ensureInit;
    document.head.appendChild(script);
  }, [jsKey]);

  const fullUrl = () => `${window.location.origin}${path}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(fullUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("아래 링크를 복사하세요", fullUrl());
    }
  }

  function shareKakao() {
    if (!window.Kakao?.isInitialized()) return;
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description,
        imageUrl: `${window.location.origin}${path}/opengraph-image`,
        link: { mobileWebUrl: fullUrl(), webUrl: fullUrl() },
      },
      buttons: [
        {
          title: "결과 보러가기",
          link: { mobileWebUrl: fullUrl(), webUrl: fullUrl() },
        },
      ],
    });
  }

  return (
    <div className="flex gap-2">
      {kakaoReady && (
        <button
          type="button"
          onClick={shareKakao}
          className="flex-1 rounded-xl bg-[#FEE500] px-4 py-3 text-sm font-bold text-[#191919] transition hover:opacity-90"
        >
          카카오톡 공유
        </button>
      )}
      <button
        type="button"
        onClick={copyLink}
        className="flex-1 rounded-xl border border-line bg-card px-4 py-3 text-sm font-bold transition hover:border-accent"
      >
        {copied ? "복사됐어요!" : "링크 복사"}
      </button>
    </div>
  );
}

"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Meta 픽셀 — NEXT_PUBLIC_META_PIXEL_ID가 설정된 경우에만 로드.
// 광고 집행 전에는 env 미설정 → 아무것도 렌더하지 않음(스크립트 0바이트).
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// 결제 완료 등 주요 전환 지점에서 호출하는 헬퍼 (픽셀 미설정 시 no-op)
export function trackPixel(event: string, data?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.fbq) window.fbq("track", event, data);
}

export default function MetaPixel() {
  const pathname = usePathname();
  const loaded = useRef(false);

  // SPA 라우팅 시 PageView 추가 전송 (최초 1회는 init 스니펫이 전송)
  useEffect(() => {
    if (!PIXEL_ID) return;
    if (!loaded.current) {
      loaded.current = true;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  if (!PIXEL_ID) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
    </Script>
  );
}

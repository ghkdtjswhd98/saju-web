import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Noto_Sans_KR } from "next/font/google";
import Link from "next/link";
import MetaPixel from "@/components/MetaPixel";
import SiteHeader from "@/components/SiteHeader";
import BottomTabs from "@/components/home/BottomTabs";
import { SITE } from "@/lib/site";
import "./globals.css";

const notoKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "오롭미 — 회원가입 없는 무료 AI 사주",
    template: "%s | 오롭미",
  },
  description:
    "계산은 만세력으로 정확하게, 해석은 AI로 깊이 있게. 회원가입 없이 30초 만에 보는 무료사주.",
  keywords: ["무료사주", "무료운세", "AI 사주", "사주풀이", "궁합", "올해운세", "신년운세"],
  openGraph: {
    siteName: "오롭미 | All of Me",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${notoKr.variable} h-full antialiased`}>
      {/* 사이트 전체가 딥네이비 셸 — admin만 app/admin/layout.tsx에서 theme-day로 되돌린다 */}
      <body className="theme-night min-h-full flex flex-col bg-bg text-ink">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line mt-16">
          <div className="mx-auto max-w-[430px] px-5 py-8 text-xs text-ink-soft space-y-3">
            <nav className="flex gap-4">
              <Link href="/terms" className="text-accent-strong hover:underline">이용약관</Link>
              <Link href="/privacy" className="text-accent-strong font-medium hover:underline">개인정보처리방침</Link>
              <Link href="/refund" className="text-accent-strong hover:underline">환불정책</Link>
            </nav>
            <div className="space-y-0.5">
              <p>
                상호: {SITE.brandName} · 대표: {SITE.ownerName} · 사업자등록번호: {SITE.bizNumber}
              </p>
              <p>주소: {SITE.address}</p>
              <p>
                전화: {SITE.phone} · 문의: {SITE.email}
              </p>
              <p>{SITE.mailOrderNote}</p>
            </div>
            <div className="space-y-0.5 border-t border-line pt-3">
              <p>오롭미 | All of Me — 재미와 자기 이해를 위한 콘텐츠이며, 의료·법률·투자 판단의 근거가 될 수 없어요.</p>
              <p>팔자 계산은 만세력 데이터 기반 결정론적 알고리즘으로 수행됩니다.</p>
            </div>
          </div>
        </footer>
        {/* 하단 5탭 — 경로 규칙(홈·리포트·케미·테스트·일간에서만)은 컴포넌트 안에서 판단, 그 외 경로는 null */}
        <BottomTabs />
        {/* 방문→무료→체크아웃→리포트 퍼널은 페이지뷰 경로로 측정 (Vercel 배포 시 활성화) */}
        <Analytics />
        {/* NEXT_PUBLIC_META_PIXEL_ID 설정 시에만 활성화 — 광고 집행 단계에서 등록 */}
        <MetaPixel />
      </body>
    </html>
  );
}

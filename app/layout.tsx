import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import Link from "next/link";
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
      <body className="min-h-full flex flex-col">
        <header className="border-b border-line bg-card/70 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-xl px-5 py-3 flex items-center justify-between">
            <Link href="/" className="font-bold tracking-tight text-ink">
              오롭미 <span className="text-ink-soft font-normal text-sm">| All of Me</span>
            </Link>
            <Link
              href="/products"
              className="text-sm text-accent-strong font-medium hover:underline"
            >
              심층 리포트
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line mt-16">
          <div className="mx-auto max-w-xl px-5 py-8 text-xs text-ink-soft space-y-1">
            <p>오롭미 | All of Me — 재미와 자기 이해를 위한 콘텐츠이며, 의료·법률·투자 판단의 근거가 될 수 없어요.</p>
            <p>팔자 계산은 만세력 데이터 기반 결정론적 알고리즘으로 수행됩니다.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

import { ImageResponse } from "next/og";
import { getProduct, PRODUCTS, type ProductCode } from "@/lib/products";
import { loadKoreanFont } from "@/lib/og-font";

// 상품 포스터 썸네일 900×600 (3:2) — 홈·상품 목록 카드의 얼굴.
// 압구정연애박사 벤치마킹(2026-08-30, docs/benchmark-love119-ux.md)의 포스터 공식을 자체 제작:
//   [상품별 무드 배경] + [질문형 소문구] + [대형 붓글씨 상품명] + [감정 트리거 오브젝트] + [뱃지]
// 사용: /brand/poster/reunion  (옛 /brand/poster?product=reunion 은 308 리다이렉트)
// love119 모바일 벤치마킹(권고 1): 요청마다 폰트 2종을 받아 그리느라 첫 방문자가 5~6초 흰 빈칸을 봤다 —
// 빌드 때 10장을 한 번만 그려 정적 서빙한다. 로딩 중 자리표시 색은 lib/poster-art.ts POSTER_BG(ARTS bg와 맞춤).
export const runtime = "nodejs";
export const dynamic = "force-static";

export function generateStaticParams() {
  return (Object.keys(PRODUCTS) as ProductCode[]).map((code) => ({ code }));
}

interface Art {
  bg: string; // 배경 그라데이션
  fg: string; // 제목 색
  sub: string; // 소문구 색
  badge?: string; // 상단 뱃지 텍스트
  question: string; // 질문형 소문구
  title: string; // 대형 제목 (짧게)
  emoji: string; // 무드 오브젝트
  chat?: { name: string; msg: string }; // 카톡 알림 목업 (재회·썸의 심장)
  glow?: string; // 제목 글로우 색 (도화살 네온용)
}

const ARTS: Record<string, Art> = {
  reunion: {
    bg: "linear-gradient(160deg, #0d1330 0%, #1a2148 55%, #2b2c5e 100%)",
    fg: "#dfe4ff", sub: "#9aa3d8",
    badge: "재회의 골든타임",
    question: "그 사람도 오늘 밤, 잠들지 못했을까요?",
    title: "재회운세",
    emoji: "🌙",
    chat: { name: "전 연인", msg: "자니..?" },
  },
  marriage: {
    bg: "linear-gradient(170deg, #7fb2e6 0%, #a8cdf0 45%, #eef5fc 100%)",
    fg: "#ffffff", sub: "#e8f2fd",
    badge: "Wedding",
    question: "당신의 배우자가 궁금하신가요?",
    title: "결혼운세",
    emoji: "💍",
  },
  love: {
    bg: "linear-gradient(165deg, #ffd6e3 0%, #ff9dbd 55%, #ff6f9f 100%)",
    fg: "#ffffff", sub: "#8f2c50",
    badge: "궁합 신호",
    question: "이 인연, 그냥 스칠까요? 이어질까요?",
    title: "궁합운세",
    emoji: "💘",
  },
  dohwa: {
    bg: "linear-gradient(160deg, #23070f 0%, #3d0d1c 55%, #571426 100%)",
    fg: "#ff4d6d", sub: "#c98a97",
    badge: "내게 숨겨진 매력",
    question: "내 사주에 도화살, 정말 있을까?",
    title: "도화살",
    emoji: "🌺",
    glow: "#ff1e4d",
  },
  year: {
    bg: "linear-gradient(165deg, #16437c 0%, #2763a8 55%, #3f83c9 100%)",
    fg: "#ffffff", sub: "#cfe3f7",
    badge: "2026 병오년",
    question: "당신의 2026, 남은 흐름이 궁금하신가요?",
    title: "올해운세",
    emoji: "🐎",
  },
  career: {
    bg: "linear-gradient(160deg, #0d2b23 0%, #14483a 55%, #1d6650 100%)",
    fg: "#ffe9a8", sub: "#a8cfc0",
    badge: "재물의 그릇",
    question: "돈이 붙는 일은 따로 있다던데?",
    title: "직업·재물운",
    emoji: "🪙",
  },
  lifetime: {
    bg: "linear-gradient(160deg, #2d2350 0%, #443a75 55%, #5d5096 100%)",
    fg: "#f2edff", sub: "#c3b8ea",
    badge: "나의 전체 설계도",
    question: "타고난 내 팔자, 전부 펼쳐볼까요?",
    title: "평생사주",
    emoji: "🔮",
  },
  crush: {
    bg: "linear-gradient(165deg, #ffb98a 0%, #f78bb1 55%, #a186d9 100%)",
    fg: "#ffffff", sub: "#6d3a5e",
    badge: "짝사랑 · 썸",
    question: "그 사람도 나를 생각하고 있을까?",
    title: "속마음운세",
    emoji: "💌",
    chat: { name: "그 사람", msg: "(입력 중...)" },
  },
  deep: {
    bg: "linear-gradient(160deg, #1c1a17 0%, #2e2a24 55%, #453d31 100%)",
    fg: "#ecd9a0", sub: "#b3a88f",
    badge: "35페이지 프리미엄",
    question: "철학원 안 가도 되는 이유",
    title: "정통 심층사주",
    emoji: "📜",
  },
  bundle: {
    bg: "linear-gradient(160deg, #4a1d6e 0%, #6b2fa0 55%, #8a4ec4 100%)",
    fg: "#ffffff", sub: "#e3cdfa",
    badge: "가장 알뜰",
    question: "고민하지 말고, 한 번에 전부",
    title: "풀패키지",
    emoji: "🎁",
  },
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const art = ARTS[code];
  const product = getProduct(code);
  if (!art || !product) return new Response("bad product", { status: 400 });

  const brushText = art.title;
  const sansText = `${art.question}${art.badge ?? ""}오롭미${art.chat ? art.chat.name + art.chat.msg + "방금" : ""}`;
  const [brush, sans] = await Promise.all([
    loadKoreanFont(brushText, "Nanum+Brush+Script"),
    loadKoreanFont(sansText),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", background: art.bg,
          fontFamily: "sans", position: "relative",
        }}
      >
        {/* 무드 오브젝트 — 우상단 크게, 은은하게 */}
        <div style={{ display: "flex", position: "absolute", top: 36, right: 44, fontSize: 96, opacity: 0.9 }}>
          {art.emoji}
        </div>
        <div style={{ display: "flex", position: "absolute", bottom: -30, left: -20, fontSize: 150, opacity: 0.14 }}>
          {art.emoji}
        </div>

        {/* 브랜드 소문구 */}
        <div style={{ display: "flex", fontSize: 20, letterSpacing: 10, color: art.sub, marginBottom: 14 }}>
          오롭미
        </div>

        {/* 뱃지 */}
        {art.badge ? (
          <div
            style={{
              display: "flex", fontSize: 24, color: art.fg, padding: "6px 26px",
              border: `2px solid ${art.fg}66`, borderRadius: 999, marginBottom: 18,
            }}
          >
            {art.badge}
          </div>
        ) : null}

        {/* 질문형 소문구 */}
        <div style={{ display: "flex", fontSize: 30, color: art.sub, marginBottom: 6 }}>
          {art.question}
        </div>

        {/* 대형 붓글씨 제목 */}
        <div
          style={{
            display: "flex", fontFamily: "brush", fontSize: 150, color: art.fg,
            lineHeight: 1.05,
            textShadow: art.glow
              ? `0 0 34px ${art.glow}, 0 0 70px ${art.glow}`
              : "0 4px 24px rgba(0,0,0,0.25)",
          }}
        >
          {art.title}
        </div>

        {/* 카톡 알림 목업 — 재회·썸 전용 감정 트리거 */}
        {art.chat ? (
          <div
            style={{
              display: "flex", alignItems: "center", gap: 16, marginTop: 26,
              background: "#ffffff", borderRadius: 20, padding: "16px 26px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.35)", width: 420,
            }}
          >
            <div
              style={{
                display: "flex", width: 52, height: 52, borderRadius: 26,
                background: "#d5d5d5",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
              <div style={{ display: "flex", fontSize: 20, color: "#666" }}>{art.chat.name}</div>
              <div style={{ display: "flex", fontSize: 26, color: "#111", fontWeight: 700 }}>
                {art.chat.msg}
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 18, color: "#999" }}>방금</div>
          </div>
        ) : null}
      </div>
    ),
    {
      width: 900,
      height: 600,
      emoji: "twemoji",
      fonts: [
        { name: "brush", data: brush, weight: 400 as const },
        { name: "sans", data: sans, weight: 700 as const },
      ],
      headers: {
        // 포스터는 아트 디렉션이 바뀔 때만 달라진다 — CDN에 하루 캐시
        "cache-control": "public, max-age=86400, s-maxage=86400",
      },
    },
  );
}

import { ImageResponse } from "next/og";
import { getProduct, PRODUCTS, type ProductCode } from "@/lib/products";
import { loadKoreanFont } from "@/lib/og-font";

// 세로 포스터 600×750 (4:5) — 홈 캐러셀·레일 전용. 상품 상세·목록은 가로(app/brand/poster/[code])를 그대로 쓴다.
// 홈 v2 1안 목업(밤하늘 계열)에 맞춰 어두운 남색 베이스 + 초승달·별 + 금색 붓글씨 제목 + 'OROBMI · PDF n PAGES' 워드마크.
// 목업처럼 질문형 소문구는 넣지 않는다 — 카드 캡션(cardTitle)이 같은 문장을 이미 담당하고, 레일 150px에서는 읽히지도 않는다.
// 가로 포스터와 같은 이유로 빌드 때 10장을 한 번만 그려 정적 서빙한다(첫 방문자 흰 빈칸 방지).
// 사용: /brand/poster-portrait/reunion
export const runtime = "nodejs";
export const dynamic = "force-static";

export function generateStaticParams() {
  return (Object.keys(PRODUCTS) as ProductCode[]).map((code) => ({ code }));
}

interface Art {
  bg: string; // 배경 그라데이션 — 가로 포스터 ARTS.bg 기반, 밝은 하늘색·핑크 계열은 밤하늘과 어울리게 채도를 낮추고 어둡게
  sub: string; // 워드마크 색(배경과 같은 계열의 밝은 톤)
  title: string; // 대형 붓글씨 제목 (가로 포스터와 동일)
  chat?: { name: string; msg: string }; // 카톡 알림 목업 (재회·속마음)
}

// 제목·워드마크 색은 목업과 같이 전 상품 금색으로 통일 — 홈의 금색 가격과 한 톤으로 묶인다
const GOLD = "#FFE9A8";
const STAR = "#CFC4E8";

const ARTS: Record<string, Art> = {
  reunion: {
    bg: "linear-gradient(160deg, #0d1330 0%, #1a2148 55%, #2b2c5e 100%)",
    sub: "#9aa3d8",
    title: "재회운세",
    chat: { name: "전 연인", msg: "자니..?" },
  },
  marriage: {
    bg: "linear-gradient(170deg, #1b3452 0%, #274a70 55%, #3d6690 100%)",
    sub: "#c6d8ec",
    title: "결혼운세",
  },
  love: {
    bg: "linear-gradient(165deg, #2a1630 0%, #48244a 55%, #66365f 100%)",
    sub: "#d8bfd4",
    title: "궁합운세",
  },
  dohwa: {
    bg: "linear-gradient(160deg, #23070f 0%, #3d0d1c 55%, #571426 100%)",
    sub: "#c98a97",
    title: "도화살",
  },
  year: {
    bg: "linear-gradient(165deg, #112c56 0%, #1b467c 55%, #2a5d98 100%)",
    sub: "#c3d7ee",
    title: "올해운세",
  },
  career: {
    bg: "linear-gradient(160deg, #0d2b23 0%, #14483a 55%, #1d6650 100%)",
    sub: "#a8cfc0",
    title: "직업·재물운",
  },
  lifetime: {
    bg: "linear-gradient(160deg, #2d2350 0%, #443a75 55%, #5d5096 100%)",
    sub: "#c3b8ea",
    title: "평생사주",
  },
  crush: {
    bg: "linear-gradient(165deg, #5c3f3a 0%, #4f2e4e 55%, #2f2856 100%)",
    sub: "#dcc3cf",
    title: "속마음운세",
    chat: { name: "그 사람", msg: "(입력 중...)" },
  },
  deep: {
    bg: "linear-gradient(160deg, #4a3b72 0%, #2b2340 55%, #17131f 100%)",
    sub: "#b9a9dd",
    title: "정통 심층사주",
  },
  bundle: {
    bg: "linear-gradient(160deg, #3a1758 0%, #58268a 55%, #7040a8 100%)",
    sub: "#dcc9f5",
    title: "풀패키지",
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

  const wordmark = `OROBMI · PDF ${product.pdfPages} PAGES`;
  const brushText = art.title;
  const sansText = `${wordmark}${art.chat ? art.chat.name + art.chat.msg + "방금" : ""}`;
  // 제목 크기 — 목업(캐러셀 322px에 66px = 폭의 20%)대로 4자 기준 122px. 긴 제목은 좌우 여백(44+36) 안에 한 줄로 들어가게 줄인다
  const titleLen = art.title.replace(/\s/g, "").length;
  const titleSize = titleLen <= 4 ? 122 : titleLen === 5 ? 112 : 100;
  const [brush, sans] = await Promise.all([
    loadKoreanFont(brushText, "Nanum+Brush+Script"),
    loadKoreanFont(sansText),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          background: art.bg, fontFamily: "sans", position: "relative",
        }}
      >
        {/* 밤하늘 베이스 — 아래쪽을 어둡게 눌러 제목 대비를 확보하고, 우상단은 은은하게 밝힌다 */}
        <div
          style={{
            display: "flex", position: "absolute", top: 0, left: 0, width: 600, height: 750,
            background: "linear-gradient(180deg, rgba(23,19,31,0) 38%, rgba(23,19,31,0.62) 100%)",
          }}
        />
        <div
          style={{
            display: "flex", position: "absolute", top: 0, left: 0, width: 600, height: 750,
            background: "radial-gradient(circle at 78% 18%, rgba(255,233,168,0.16) 0%, rgba(255,233,168,0) 46%)",
          }}
        />

        {/* 초승달 + 별 + 달무리 링 — 목업 포스터 장식을 600×750 좌표로 옮김 */}
        <svg
          width="600" height="750" viewBox="0 0 600 750"
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <circle cx="78" cy="138" r="3.4" fill={STAR} opacity="0.8" />
          <circle cx="224" cy="78" r="2.4" fill={STAR} opacity="0.6" />
          <circle cx="372" cy="236" r="2.1" fill="#F2EEF9" opacity="0.7" />
          <circle cx="540" cy="296" r="3" fill="#B9A9DD" opacity="0.8" />
          <circle cx="112" cy="454" r="2.6" fill="#B9A9DD" opacity="0.6" />
          <circle cx="474" cy="590" r="2.8" fill={STAR} opacity="0.6" />
          <circle cx="300" cy="345" r="184" fill="none" stroke={GOLD} strokeOpacity="0.24" strokeWidth="1.6" />
          <circle cx="300" cy="345" r="135" fill="none" stroke={GOLD} strokeOpacity="0.14" strokeWidth="1.6" strokeDasharray="5 11" />
          <path d="M432 128 a48 48 0 1 0 26 85 a37 37 0 1 1 -26 -85 Z" fill={GOLD} opacity="0.95" />
          <path d="M300 208 l11 33 l33 11 l-33 11 l-11 33 l-11 -33 l-33 -11 l33 -11 z" fill={GOLD} opacity="0.9" />
          <path d="M172 364 l6 17 l17 6 l-17 6 l-6 17 l-6 -17 l-17 -6 l17 -6 z" fill={GOLD} opacity="0.7" />
        </svg>

        {/* 카톡 알림 목업 — 재회·속마음 전용 감정 트리거, 달무리 링 가운데 */}
        {art.chat ? (
          <div
            style={{
              display: "flex", alignItems: "center", gap: 16, position: "absolute", top: 302, left: 90,
              background: "#ffffff", borderRadius: 20, padding: "16px 24px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.4)", width: 420,
            }}
          >
            <div style={{ display: "flex", width: 52, height: 52, borderRadius: 26, background: "#d5d5d5" }} />
            <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
              <div style={{ display: "flex", fontSize: 20, color: "#666" }}>{art.chat.name}</div>
              <div style={{ display: "flex", fontSize: 28, color: "#111", fontWeight: 700 }}>{art.chat.msg}</div>
            </div>
            <div style={{ display: "flex", fontSize: 18, color: "#999" }}>방금</div>
          </div>
        ) : null}

        {/* 붓글씨 제목 → 워드마크: 목업처럼 좌하단 정렬 */}
        <div
          style={{
            display: "flex", flexDirection: "column", position: "absolute", left: 44, right: 36, bottom: 44,
          }}
        >
          <div
            style={{
              display: "flex", fontFamily: "brush", fontSize: titleSize, color: GOLD, lineHeight: 1.1, whiteSpace: "nowrap",
              textShadow: "0 4px 24px rgba(0,0,0,0.35)",
            }}
          >
            {art.title}
          </div>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: art.sub, opacity: 0.85, marginTop: 6 }}>
            {wordmark}
          </div>
        </div>
      </div>
    ),
    {
      width: 600,
      height: 750,
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

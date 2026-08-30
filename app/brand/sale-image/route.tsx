import { ImageResponse } from "next/og";
import { getPricing } from "@/lib/pricing";
import { getProduct } from "@/lib/products";
import { loadKoreanFont } from "@/lib/og-font";

// 당근 판매글·SNS용 상품 썸네일 1080×1080.
// 비대면 사주 상위 판매자 공통 공식(정가 병기 반값 + 페이지 수 + 납기)을 이미지에 그대로 반영.
// 사용:
//   /brand/sale-image?product=lifetime  → 상품 썸네일
//   /brand/sale-image?banner=speed      → 당근 사진 1번 슬롯 (속도)
//   /brand/sale-image?banner=price      → 2번 슬롯 (가격)
//   /brand/sale-image?banner=why        → 6번 슬롯 (왜 26장인가)
export const runtime = "nodejs";

// ⚠️ 당근 표기 가격은 웹 정가와 별개로 운영한다(플랫폼별 차등).
//    lib/products.ts를 바꿔도 여기는 따라가지 않으니, 당근 가격표를 고칠 땐 여기도 같이 고칠 것.
const DANGGEUN = {
  listPrice: "29,900원",
  salePrice: "14,900원",
  regularPrice: "11,900원",
  // 실측 22,963자 / 26페이지. 광고 수치는 항상 실측 이하로 적는다.
  // 발송 시간: 심층 4구간 실측 12~13분 → "15분"으로 표기 (10분은 과장이었음 — 2026-08-17 정정)
  pages: "26",
  minutes: "15",
};

// Satori 제약 메모 (실제로 터졌던 것들):
//   · Fragment(<>) 미지원
//   · 자식이 2개 이상인 div에는 display:flex 명시 필수
//   · 텍스트와 표현식을 섞으면 `{`...${x}...`}` 템플릿 리터럴로 통일해야 함
async function renderBanner(kind: string) {
  const CREAM = "#faf7f2";
  const INK = "#3d3d3d";
  const SOFT = "#7a7a7a";
  const PURPLE = "#7c68a6";
  const NAVY = "#272132";

  if (kind === "speed") {
    const text = `${DANGGEUN.minutes}분 만에 도착하는 사주신청하고 커피 한 잔 하시는 동안PDF ${DANGGEUN.pages}페이지가 도착해요새벽에도 발송됩니다오롭미 | All of Me0123456789·`;
    const font = await loadKoreanFont(text);
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: NAVY,
            fontFamily: "NotoKR",
            color: "#ffffff",
            padding: 80,
          }}
        >
          <div style={{ fontSize: 30, color: "#b9a9dd", letterSpacing: 8 }}>오롭미 | All of Me</div>
          <div
            style={{
              fontSize: 128,
              fontWeight: 700,
              marginTop: 56,
              color: "#c9b6f2",
              lineHeight: 1.1,
            }}
          >
            {`${DANGGEUN.minutes}분`}
          </div>
          <div style={{ fontSize: 62, fontWeight: 700, marginTop: 8, textAlign: "center", lineHeight: 1.3 }}>
            만에 도착하는 사주
          </div>
          <div style={{ fontSize: 34, marginTop: 56, color: "#cfc8dd", textAlign: "center", lineHeight: 1.6 }}>
            신청하고 커피 한 잔 하시는 동안
          </div>
          <div style={{ fontSize: 38, marginTop: 10, color: "#ffffff", textAlign: "center" }}>
            {`PDF ${DANGGEUN.pages}페이지가 도착해요`}
          </div>
          <div
            style={{
              fontSize: 30,
              marginTop: 60,
              color: "#b9a9dd",
              background: "#37304a",
              borderRadius: 999,
              padding: "18px 40px",
            }}
          >
            새벽에도 발송됩니다
          </div>
        </div>
      ),
      { width: 1080, height: 1080, fonts: [{ name: "NotoKR", data: font, weight: 700, style: "normal" }] },
    );
  }

  if (kind === "price") {
    const text = `입점 특가종합 사주 ${DANGGEUN.pages}페이지${DANGGEUN.listPrice}${DANGGEUN.salePrice}단골 맺으면 ${DANGGEUN.regularPrice}${DANGGEUN.minutes}분 내 발송 · 만세력 계산오롭미 | All of Me0123456789,·`;
    const font = await loadKoreanFont(text);
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: CREAM,
            fontFamily: "NotoKR",
            color: INK,
            padding: 80,
          }}
        >
          <div
            style={{
              fontSize: 30,
              color: "#ffffff",
              background: "#d0574f",
              borderRadius: 999,
              padding: "16px 40px",
              letterSpacing: 2,
            }}
          >
            입점 특가
          </div>
          <div style={{ fontSize: 52, fontWeight: 700, marginTop: 44, textAlign: "center" }}>
            {`종합 사주 ${DANGGEUN.pages}페이지`}
          </div>
          {/* 폰트 크기 차가 크면 baseline 정렬이 줄을 옆으로 밀어버린다 — 세로로 쌓는다 */}
          <div style={{ fontSize: 44, color: "#a9a29a", textDecoration: "line-through", marginTop: 46 }}>
            {DANGGEUN.listPrice}
          </div>
          <div style={{ fontSize: 124, fontWeight: 700, color: PURPLE, marginTop: 4, lineHeight: 1.15 }}>
            {DANGGEUN.salePrice}
          </div>
          <div
            style={{
              fontSize: 36,
              marginTop: 40,
              color: PURPLE,
              background: "#efe9f7",
              borderRadius: 999,
              padding: "20px 44px",
            }}
          >
            {`단골 맺으면 ${DANGGEUN.regularPrice}`}
          </div>
          <div style={{ fontSize: 30, marginTop: 56, color: SOFT }}>
            {`${DANGGEUN.minutes}분 내 발송 · 만세력 계산`}
          </div>
          <div style={{ fontSize: 26, marginTop: 20, color: "#b9a9dd", letterSpacing: 6 }}>
            오롭미 | All of Me
          </div>
        </div>
      ),
      { width: 1080, height: 1080, fonts: [{ name: "NotoKR", data: font, weight: 700, style: "normal" }] },
    );
  }

  // why — "왜 26장인가". 타사 비방 없이 우리 선택만 설명한다(비교광고 리스크 회피).
  const text = `길게 쓰는 건 쉽습니다읽히게 쓰는 게 어렵죠늘리면 결국 같은 말을 다르게 반복하게 됩니다그래서 ${DANGGEUN.pages}장으로 끝냅니다버릴 문장 없이오롭미 | All of Me0123456789·,`;
  const font = await loadKoreanFont(text);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: CREAM,
          fontFamily: "NotoKR",
          color: INK,
          padding: 90,
        }}
      >
        <div style={{ fontSize: 46, color: SOFT, textAlign: "center" }}>길게 쓰는 건 쉽습니다</div>
        <div
          style={{
            fontSize: 62,
            fontWeight: 700,
            marginTop: 18,
            color: INK,
            textAlign: "center",
            lineHeight: 1.35,
          }}
        >
          읽히게 쓰는 게 어렵죠
        </div>
        <div
          style={{
            width: 120,
            height: 3,
            background: "#e4ded6",
            marginTop: 56,
          }}
        />
        <div style={{ fontSize: 32, marginTop: 56, color: SOFT, textAlign: "center", lineHeight: 1.7 }}>
          분량을 늘리면 결국
        </div>
        <div style={{ fontSize: 32, marginTop: 6, color: SOFT, textAlign: "center", lineHeight: 1.7 }}>
          같은 말을 다르게 반복하게 됩니다
        </div>
        <div style={{ fontSize: 68, fontWeight: 700, marginTop: 56, color: PURPLE, textAlign: "center" }}>
          {`그래서 ${DANGGEUN.pages}장으로 끝냅니다`}
        </div>
        <div style={{ fontSize: 36, marginTop: 20, color: INK }}>버릴 문장 없이</div>
        <div style={{ fontSize: 26, marginTop: 64, color: "#b9a9dd", letterSpacing: 6 }}>
          오롭미 | All of Me
        </div>
      </div>
    ),
    { width: 1080, height: 1080, fonts: [{ name: "NotoKR", data: font, weight: 700, style: "normal" }] },
  );
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;

  const banner = params.get("banner");
  if (banner) {
    if (!["speed", "price", "why"].includes(banner)) {
      return new Response("unknown banner", { status: 404 });
    }
    return renderBanner(banner);
  }

  const code = params.get("product") ?? "lifetime";
  const product = getProduct(code);
  if (!product) return new Response("not found", { status: 404 });
  const pricing = await getPricing();
  const price = pricing.prices[product.code];

  const badges = [
    `PDF ${product.pdfPages}페이지`,
    `${product.charCount} 분량`,
    "1~2분 즉시 발급",
  ];
  const text = `오롭미 | All of Me${product.name}${product.tagline}${badges.join("")}${price.list.toLocaleString()}원${price.current.toLocaleString()}원만세력 계산 + 깊이 있는 해석회원가입 없이 · 링크 평생보관0123456789,`;
  const font = await loadKoreanFont(text);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf7f2",
          fontFamily: "NotoKR",
          color: "#3d3d3d",
          padding: 70,
        }}
      >
        <div style={{ fontSize: 30, color: "#8f7bb8", letterSpacing: 8 }}>오롭미 | All of Me</div>

        <div style={{ fontSize: 66, fontWeight: 700, marginTop: 40, textAlign: "center" }}>
          {product.name}
        </div>
        <div style={{ fontSize: 32, marginTop: 20, color: "#7a7a7a", textAlign: "center" }}>
          {product.tagline}
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 54 }}>
          {badges.map((b) => (
            <div
              key={b}
              style={{
                fontSize: 27,
                color: "#7c68a6",
                background: "#efe9f7",
                borderRadius: 999,
                padding: "16px 30px",
              }}
            >
              {b}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 22, marginTop: 60 }}>
          <div
            style={{
              fontSize: 40,
              color: "#a9a29a",
              textDecoration: "line-through",
            }}
          >
            {`${price.list.toLocaleString()}원`}
          </div>
          <div style={{ fontSize: 88, fontWeight: 700, color: "#7c68a6" }}>
            {`${price.current.toLocaleString()}원`}
          </div>
        </div>

        <div style={{ fontSize: 30, marginTop: 54, color: "#3d3d3d" }}>
          만세력 계산 + 깊이 있는 해석
        </div>
        <div style={{ fontSize: 26, marginTop: 14, color: "#7a7a7a" }}>
          회원가입 없이 · 링크 평생보관
        </div>
      </div>
    ),
    { width: 1080, height: 1080, fonts: [{ name: "NotoKR", data: font, weight: 700, style: "normal" }] },
  );
}

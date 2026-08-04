import { ImageResponse } from "next/og";
import { getPricing } from "@/lib/pricing";
import { getProduct } from "@/lib/products";
import { loadKoreanFont } from "@/lib/og-font";

// 당근 판매글·SNS용 상품 썸네일 1080×1080.
// 비대면 사주 상위 판매자 공통 공식(정가 병기 반값 + 페이지 수 + 납기)을 이미지에 그대로 반영.
// 사용: /brand/sale-image?product=lifetime → 우클릭 저장
export const runtime = "nodejs";

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("product") ?? "lifetime";
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

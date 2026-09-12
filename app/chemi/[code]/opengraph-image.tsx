import { ImageResponse } from "next/og";
import { getChemiLink } from "@/lib/chemi";
import { loadKoreanFont } from "@/lib/og-font";

// 케미 초대 링크 OG 카드 — 카톡·인스타에 링크가 떨어졌을 때 "생일만 넣으면 된다"가 카드에서 바로 읽혀야 한다
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "친구 케미 초대";

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const link = await getChemiLink(code);
  const nickname = link?.nickname ?? "친구";

  const headline = `${nickname}님이 케미를 물어봤어요`;
  const sub = "생일만 넣으면 나와요";
  const cta = "나도 보기 →";
  const brand = "오롭미 | All of Me";
  const font = await loadKoreanFont(`${headline}${sub}${cta}${brand}친구 케미 순위로그인 없이 10초`);

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
          background: "#272132",
          fontFamily: "NotoKR",
          color: "#f2eef9",
        }}
      >
        <div style={{ fontSize: 26, color: "#b9a9dd", letterSpacing: 6 }}>친구 케미 순위</div>
        <div style={{ fontSize: 64, fontWeight: 700, marginTop: 28, textAlign: "center" }}>{headline}</div>
        <div style={{ fontSize: 40, marginTop: 18, color: "#ffe9a8", fontWeight: 700 }}>{sub}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 44 }}>
          {/* 금·은·동 뱃지 — 순위판이라는 걸 한눈에 */}
          {["#E6BE55", "#CBD0D8", "#D2925C"].map((c, i) => (
            <div
              key={c}
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                background: c,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                fontWeight: 700,
                color: "#2b2233",
              }}
            >
              {i + 1}
            </div>
          ))}
          <div style={{ fontSize: 28, color: "#b9a9dd", marginLeft: 8 }}>로그인 없이 10초</div>
        </div>
        <div
          style={{
            marginTop: 44,
            padding: "14px 40px",
            borderRadius: 999,
            background: "#ffe9a8",
            color: "#272132",
            fontSize: 30,
            fontWeight: 700,
          }}
        >
          {cta}
        </div>
        <div style={{ fontSize: 22, marginTop: 30, color: "#8f7bb8", letterSpacing: 4 }}>{brand}</div>
      </div>
    ),
    { ...size, fonts: [{ name: "NotoKR", data: font, weight: 700, style: "normal" }] },
  );
}

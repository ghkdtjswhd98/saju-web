import { ImageResponse } from "next/og";
import { OHAENG_TYPES, isElementKey } from "@/lib/ohaeng-test";
import { loadKoreanFont } from "@/lib/og-font";

// 인스타 스토리용 9:16 결과 카드 — 결과 페이지의 "이미지 저장" 버튼에서 다운로드
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  if (!isElementKey(type)) return new Response("not found", { status: 404 });
  const t = OHAENG_TYPES[type];

  const text = `오행 캐릭터 테스트나는 “${t.name}”${t.tagline}${t.korean}${t.hanja}의 기운오롭미와 함께${t.strengths.join("")}orobmi 검색 · 1분 무료 테스트`;
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
        }}
      >
        <div style={{ fontSize: 40, color: "#8f7bb8", letterSpacing: 10 }}>오행 캐릭터 테스트</div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 340,
            height: 340,
            borderRadius: 999,
            background: "#ffffff",
            border: `10px solid ${t.color}`,
            fontSize: 170,
            marginTop: 80,
          }}
        >
          {t.emoji}
        </div>
        <div style={{ fontSize: 52, marginTop: 76, color: t.color, fontWeight: 700 }}>
          {`${t.korean}(${t.hanja})의 기운`}
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, marginTop: 18, textAlign: "center" }}>
          {`“${t.name}”`}
        </div>
        <div style={{ fontSize: 46, marginTop: 28, color: "#7a7a7a" }}>{t.tagline}</div>
        <div style={{ display: "flex", gap: 20, marginTop: 70 }}>
          {t.strengths.map((s) => (
            <div
              key={s}
              style={{
                fontSize: 40,
                color: "#fff",
                background: t.color,
                borderRadius: 999,
                padding: "16px 40px",
              }}
            >
              {s}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 38, marginTop: 120, color: "#8f7bb8" }}>
          orobmi 검색 · 1분 무료 테스트
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts: [{ name: "NotoKR", data: font, weight: 700, style: "normal" }],
    },
  );
}

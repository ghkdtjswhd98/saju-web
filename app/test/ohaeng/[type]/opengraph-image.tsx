import { ImageResponse } from "next/og";
import { OHAENG_TYPES, isElementKey } from "@/lib/ohaeng-test";
import { loadKoreanFont } from "@/lib/og-font";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "오행 캐릭터 테스트 결과";

export default async function Image({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const t = isElementKey(type) ? OHAENG_TYPES[type] : OHAENG_TYPES.wood;

  const text = `오행 캐릭터 테스트나는 “${t.name}”${t.tagline}${t.korean}${t.hanja}의 기운오롭미 | All of Me너는 어떤 기운이야? 1분 테스트 →${t.strengths.join("")}`;
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
        <div style={{ fontSize: 26, color: "#8f7bb8", letterSpacing: 6 }}>오행 캐릭터 테스트</div>
        <div style={{ fontSize: 34, marginTop: 26, color: t.color, fontWeight: 700 }}>
          {`${t.korean}(${t.hanja})의 기운`}
        </div>
        <div style={{ fontSize: 68, fontWeight: 700, marginTop: 12 }}>{`나는 “${t.name}”`}</div>
        <div style={{ fontSize: 32, marginTop: 16, color: "#7a7a7a" }}>{t.tagline}</div>
        <div style={{ display: "flex", gap: 14, marginTop: 40 }}>
          {t.strengths.map((s) => (
            <div
              key={s}
              style={{
                fontSize: 26,
                color: "#fff",
                background: t.color,
                borderRadius: 999,
                padding: "10px 26px",
              }}
            >
              {s}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 26, marginTop: 44, color: "#8f7bb8" }}>
          너는 어떤 기운이야? 1분 테스트 →
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "NotoKR", data: font, weight: 700, style: "normal" }] },
  );
}

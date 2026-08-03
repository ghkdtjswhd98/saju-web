import { ImageResponse } from "next/og";
import { ILGAN_MAP } from "@/lib/ilgan-content";
import { loadKoreanFont } from "@/lib/og-font";

// 인스타 카드뉴스용 4:5(1080x1350) PNG 자동 생성 — 콘텐츠 팩 제작에 사용.
// ?slide=0 커버, 1~3 성격, 4 무기·그늘, 5 CTA
// ⚠️ Satori는 React Fragment를 지원하지 않음 — 반드시 div로 감쌀 것
export const runtime = "nodejs";

const SIZE = { width: 1080, height: 1350 };

export async function GET(
  req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const c = ILGAN_MAP[key];
  if (!c) return new Response("not found", { status: 404 });
  const slide = Number(new URL(req.url).searchParams.get("slide") ?? "0");

  const rootStyle = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    background: "#faf7f2",
    fontFamily: "NotoKR",
    color: "#3d3d3d",
  };

  if (slide === 0) {
    const text = `${c.korean}(${c.hanja}) 일간 시리즈${c.korean}인 사람의 특징${c.symbol}${c.keywords.join("")}오롭미 | All of Me`;
    const font = await loadKoreanFont(text);
    return new ImageResponse(
      (
        <div style={{ ...rootStyle, alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 34, color: "#8f7bb8", letterSpacing: 8 }}>
            {`${c.korean}(${c.hanja}) 일간 시리즈`}
          </div>
          <div style={{ fontSize: 190, marginTop: 60 }}>{c.emoji}</div>
          <div style={{ fontSize: 76, fontWeight: 700, marginTop: 60 }}>
            {`${c.korean}인 사람의 특징`}
          </div>
          <div style={{ fontSize: 38, marginTop: 22, color: "#7a7a7a" }}>{c.symbol}</div>
          <div style={{ display: "flex", gap: 16, marginTop: 56 }}>
            {c.keywords.map((k) => (
              <div
                key={k}
                style={{
                  fontSize: 32,
                  color: "#fff",
                  background: "#8f7bb8",
                  borderRadius: 999,
                  padding: "14px 34px",
                }}
              >
                {k}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 30, marginTop: 90, color: "#8f7bb8" }}>오롭미 | All of Me</div>
        </div>
      ),
      { ...SIZE, fonts: [{ name: "NotoKR", data: font, weight: 700, style: "normal" }] },
    );
  }

  let heading: string;
  let body: string[];
  if (slide >= 1 && slide <= 3) {
    heading = ["이런 사람이에요", "겉과 속", "최고의 무기"][slide - 1];
    body = [c.personality[slide - 1]];
  } else if (slide === 4) {
    heading = "무기와 그늘";
    body = [`💪 ${c.strengths}`, `🌘 ${c.shadow}`];
  } else {
    heading = "내 일간이 뭔지 모른다면";
    body = [
      "사주 여덟 글자 중 태어난 날의 천간이 바로 '나'예요.",
      "오롭미에서 회원가입 없이 30초면 무료로 나와요.",
      "프로필 링크 → 무료사주",
    ];
  }

  const text = `${heading}${body.join("")}${c.korean} 일간오롭미 — 회원가입 없는 무료사주💪🌘`;
  const font = await loadKoreanFont(text);
  return new ImageResponse(
    (
      <div style={{ ...rootStyle, padding: "110px 90px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ fontSize: 54 }}>{c.emoji}</div>
          <div style={{ fontSize: 34, color: "#8f7bb8" }}>{`${c.korean} 일간`}</div>
        </div>
        <div style={{ fontSize: 62, fontWeight: 700, marginTop: 46 }}>{heading}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 40, marginTop: 56 }}>
          {body.map((b) => (
            <div key={b.slice(0, 12)} style={{ fontSize: 40, lineHeight: 1.75 }}>
              {b}
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 70,
            left: 90,
            fontSize: 28,
            color: "#8f7bb8",
          }}
        >
          오롭미 — 회원가입 없는 무료사주
        </div>
      </div>
    ),
    { ...SIZE, fonts: [{ name: "NotoKR", data: font, weight: 700, style: "normal" }] },
  );
}

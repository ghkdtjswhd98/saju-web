import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import { getDb, reports } from "@/lib/db";
import { ILGAN_MAP, STEM_TO_KEY } from "@/lib/ilgan-content";
import { loadKoreanFont } from "@/lib/og-font";
import type { PersonInput, SajuResult } from "@/lib/saju/types";

// 무료 결과를 한 장짜리 공유 카드로 — 캡처가 곧 광고가 되는 구조.
// 재미 조사(2026-08-12) 근거: 공유 단위는 결과 전체가 아니라 "유형명+별명+한 줄"이 담긴
// 한 화면이고(16 Personalities 공식), 팔자 표는 서비스 밖으로 들고 다녀지는 오브젝트다.
// 워터마크(브랜드+URL)를 넣어 카드가 돌아다닐 때 출처가 함께 실리게 한다.
export const runtime = "nodejs";

const CREAM = "#faf7f2";
const INK = "#3d3d3d";
const SOFT = "#7a7a7a";
const PURPLE = "#7c68a6";
const LINE = "#e4ded6";
const EL_COLOR: Record<string, string> = {
  목: "#6a9f6a", 화: "#d07b6a", 토: "#c2a05e", 금: "#9aa3ad", 수: "#6a86b8",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shareId: string }> },
) {
  const { shareId } = await params;
  const rows = await getDb().select().from(reports).where(eq(reports.token, shareId)).limit(1);
  const report = rows[0];
  // 1인 무료 결과만 — 궁합 티저는 케미 점수 구조가 달라 별도 카드가 필요하다
  if (!report || report.productCode !== "free") return new Response("not found", { status: 404 });

  const persons = (report.inputData as { persons: PersonInput[] }).persons;
  const saju = report.sajuData as SajuResult;
  const blocks = (report.content as { blocks?: Record<string, string> } | null)?.blocks;
  const summary = blocks?.["한줄요약"] ?? "";
  const ilgan = ILGAN_MAP[STEM_TO_KEY[saju.dayMaster.char] ?? ""];

  const p = saju.pillars;
  const cols = [
    { label: "시주", v: p.hour?.hangul ?? "미상" },
    { label: "일주", v: p.day.hangul },
    { label: "월주", v: p.month.hangul },
    { label: "년주", v: p.year.hangul },
  ];
  const maxCount = Math.max(...saju.elementDist.map((e) => e.count), 1);

  const text = `오롭미ALLOFME사주무료님의시주일주월주년주미상${cols.map((c) => c.v).join("")}${persons[0].name}${ilgan?.korean ?? ""}${ilgan?.hanja ?? ""}${ilgan?.nickname ?? ""}${summary}목화토금수만세력 기반 계산saju-web-orobmi.vercel.app0123456789.·"｜`;
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
          background: CREAM,
          fontFamily: "NotoKR",
          color: INK,
          padding: "64px 72px",
        }}
      >
        <div style={{ fontSize: 26, color: PURPLE, letterSpacing: 8 }}>오롭미 ｜ All of Me</div>

        <div style={{ fontSize: 40, fontWeight: 700, marginTop: 36 }}>
          {`${persons[0].name}님의 사주`}
        </div>

        {/* 일간 유형 배지 — 유형명 + 별명 (16P 공식) */}
        {ilgan && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: 28,
              background: "#efe9f7",
              borderRadius: 24,
              padding: "22px 44px",
            }}
          >
            <div style={{ fontSize: 34, fontWeight: 700, color: PURPLE, display: "flex" }}>
              {`${ilgan.emoji} ${ilgan.korean} (${ilgan.hanja}) 일간`}
            </div>
            <div style={{ fontSize: 26, color: INK, marginTop: 8 }}>{ilgan.nickname}</div>
          </div>
        )}

        {/* 한 줄 요약 — 공유되는 건 이 한 문장이다 */}
        {summary && (
          <div
            style={{
              fontSize: 34,
              fontWeight: 700,
              marginTop: 40,
              textAlign: "center",
              lineHeight: 1.45,
              maxWidth: 860,
              display: "flex",
            }}
          >
            {`“${summary}”`}
          </div>
        )}

        {/* 팔자 표 */}
        <div style={{ display: "flex", gap: 14, marginTop: 44 }}>
          {cols.map((c) => (
            <div
              key={c.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "#ffffff",
                border: `2px solid ${LINE}`,
                borderRadius: 18,
                padding: "18px 30px",
              }}
            >
              <div style={{ fontSize: 20, color: SOFT }}>{c.label}</div>
              <div style={{ fontSize: 40, fontWeight: 700, marginTop: 6 }}>{c.v}</div>
            </div>
          ))}
        </div>

        {/* 오행 바 */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 40, width: 760 }}>
          {saju.elementDist.map((e) => (
            <div key={e.name} style={{ display: "flex", alignItems: "center", marginTop: 10 }}>
              <div style={{ fontSize: 24, width: 40, color: INK, display: "flex" }}>{e.name}</div>
              <div
                style={{
                  display: "flex",
                  height: 22,
                  width: Math.max(30, Math.round((e.count / maxCount) * 640)),
                  background: EL_COLOR[e.name] ?? SOFT,
                  borderRadius: 999,
                }}
              />
              <div style={{ fontSize: 20, color: SOFT, marginLeft: 12, display: "flex" }}>
                {e.count.toFixed(1)}
              </div>
            </div>
          ))}
        </div>

        {/* 워터마크 — 카드가 돌아다닐 때 출처가 함께 간다 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "auto",
          }}
        >
          <div style={{ fontSize: 22, color: SOFT }}>만세력 기반 계산 · 회원가입 없이 30초</div>
          <div style={{ fontSize: 24, color: PURPLE, marginTop: 6, fontWeight: 700 }}>
            saju-web-orobmi.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
      fonts: [{ name: "NotoKR", data: font, weight: 700, style: "normal" }],
    },
  );
}

import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import { getDb, reports } from "@/lib/db";
import { loadKoreanFont } from "@/lib/og-font";
import type { PersonInput, SajuResult } from "@/lib/saju/types";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "오롭미 사주 결과";

const EL_COLOR: Record<string, string> = {
  목: "#6a9f6a", 화: "#d07b6a", 토: "#c2a05e", 금: "#9aa3ad", 수: "#6a86b8",
};

export default async function Image({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const rows = await getDb().select().from(reports).where(eq(reports.token, shareId)).limit(1);
  const report = rows[0];

  const person = report ? (report.inputData as { persons: PersonInput[] }).persons[0] : null;
  const saju = report ? (report.sajuData as SajuResult) : null;
  const blocks = (report?.content as { blocks?: Record<string, string> } | null)?.blocks;
  const summary = blocks?.["한줄요약"] ?? "나의 사주, 30초면 나와요";
  const title = person ? `${person.name}님의 사주` : "오롭미 무료사주";

  const text = `${title}"${summary}"오롭미 | All of Me목화토금수 무료사주 보러가기0123456789.`;
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
        <div style={{ fontSize: 28, color: "#8f7bb8", letterSpacing: 6 }}>오롭미 | All of Me</div>
        <div style={{ fontSize: 36, marginTop: 28, color: "#7a7a7a" }}>{title}</div>
        <div style={{ fontSize: 64, fontWeight: 700, marginTop: 16, maxWidth: 1000, textAlign: "center" }}>
          &ldquo;{summary}&rdquo;
        </div>
        {saju && (
          <div style={{ display: "flex", gap: 18, marginTop: 48 }}>
            {saju.elementDist.map((e) => (
              <div key={e.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 72,
                    height: Math.max(18, Math.min(e.count * 32, 120)),
                    background: EL_COLOR[e.name],
                    borderRadius: 10,
                  }}
                />
                <div style={{ fontSize: 26 }}>{e.name}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: 26, marginTop: 44, color: "#8f7bb8" }}>무료사주 보러가기 →</div>
      </div>
    ),
    { ...size, fonts: [{ name: "NotoKR", data: font, weight: 700, style: "normal" }] },
  );
}

import { eq } from "drizzle-orm";
import { getDb, reports } from "@/lib/db";
import { buildPdfForReport } from "@/lib/report-pdf";

// 리포트 PDF 다운로드 — 링크(토큰) 보유자면 누구나. 당근 채팅 판매 시 이 파일을 그대로 전달한다.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const rows = await getDb().select().from(reports).where(eq(reports.token, token)).limit(1);
  const report = rows[0];
  if (!report) return new Response("not found", { status: 404 });
  if (report.status !== "done") {
    return new Response("리포트가 아직 생성 중이에요. 완료 후 다시 시도해주세요.", { status: 409 });
  }

  const { pdf, productName, persons } = await buildPdfForReport(report);

  // 파일명은 ASCII 폴백 + RFC 5987 UTF-8 (한글 파일명 깨짐 방지)
  const nameKo = `오롭미_${productName}_${persons[0].name}.pdf`;
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="orobmi-report.pdf"; filename*=UTF-8''${encodeURIComponent(nameKo)}`,
      "cache-control": "private, max-age=3600",
    },
  });
}

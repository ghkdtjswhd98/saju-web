// 완성된 리포트 행 → PDF 버퍼. PDF 다운로드 라우트와 완성 메일 첨부가 함께 쓴다.
// (다운로드 라우트에 있던 조립 로직을 추출 — blocks 복원 최후 방어선 포함)
import { buildReportPdf } from "@/lib/pdf";
import { getProduct } from "@/lib/products";
import { FORMATS } from "@/lib/prompts/formats";
import type { PersonInput, SajuResult } from "@/lib/saju/types";

export interface ReportRowForPdf {
  productCode: string;
  inputData: unknown;
  sajuData: unknown;
  content: unknown;
  completedAt: Date | null;
  createdAt: Date;
}

export async function buildPdfForReport(
  report: ReportRowForPdf,
): Promise<{ pdf: Buffer; productName: string; persons: PersonInput[] }> {
  const content = report.content as { blocks?: Record<string, string>; rawText?: string } | null;
  let blocks = content?.blocks ?? {};
  const format = FORMATS[report.productCode];
  // 최후 방어선: 파싱이 {raw}로 떨어진 done 리포트도 rawText에서 섹션을 복원한다.
  // 이게 없으면 유료 고객이 표지뿐인 빈 PDF를 받는다.
  if (!Object.keys(blocks).some((k) => k !== "raw") && content?.rawText) {
    const rebuilt: Record<string, string> = {};
    const re = /^===([^=\n]+)===[ \t]*$/gm;
    const text = content.rawText;
    let m: RegExpExecArray | null;
    let prev: { token: string; start: number } | null = null;
    const keyOf = (token: string) =>
      format?.markers.find((mk) => mk.token === token)?.key ??
      token.slice(token.indexOf("_") + 1);
    while ((m = re.exec(text)) !== null) {
      if (prev) rebuilt[keyOf(prev.token)] = text.slice(prev.start, m.index).trim();
      prev = { token: m[1], start: m.index + m[0].length };
    }
    if (prev) rebuilt[keyOf(prev.token)] = text.slice(prev.start).trim();
    if (Object.keys(rebuilt).length) blocks = rebuilt;
  }
  // 기본 순서는 형식 정의를 따르되, 동적 섹션("물어보신 것에 대하여" 등)은 뒤에 붙인다.
  const formatKeys = format ? format.markers.map((m) => m.key) : [];
  const extraKeys = Object.keys(blocks).filter((k) => k !== "raw" && !formatKeys.includes(k));
  const order = format ? [...formatKeys.filter((k) => blocks[k]), ...extraKeys] : Object.keys(blocks);
  const persons = (report.inputData as { persons: PersonInput[] }).persons;
  const saju = Array.isArray(report.sajuData)
    ? (report.sajuData as SajuResult[])[0]
    : (report.sajuData as SajuResult);

  const productName = getProduct(report.productCode)?.name ?? "사주 리포트";
  const pdf = await buildReportPdf({
    productName,
    productCode: report.productCode,
    persons,
    saju,
    blocks,
    order,
    createdAt: report.completedAt ?? report.createdAt,
  });
  return { pdf, productName, persons };
}

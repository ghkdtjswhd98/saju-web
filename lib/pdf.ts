import PDFDocument from "pdfkit";
import { SITE } from "@/lib/site";
import type { PersonInput, SajuResult } from "@/lib/saju/types";

// 한글 가변 폰트(Noto Sans KR) 런타임 로드 — 저장소에 10MB 폰트를 넣지 않기 위해 CDN에서 받아
// 모듈 스코프에 캐시한다 (워밍된 인스턴스에서는 1회만 받음).
const FONT_URL =
  "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf";
let fontCache: Buffer | null = null;

async function loadFont(): Promise<Buffer> {
  if (fontCache) return fontCache;
  const res = await fetch(FONT_URL);
  if (!res.ok) throw new Error(`PDF 폰트 로드 실패: ${res.status}`);
  fontCache = Buffer.from(await res.arrayBuffer());
  return fontCache;
}

const INK = "#3d3d3d";
const SOFT = "#7a7a7a";
const ACCENT = "#7c68a6";
const LINE = "#e4ded6";

export interface PdfInput {
  productName: string;
  persons: PersonInput[];
  saju: SajuResult; // 궁합이면 첫 번째 사람 기준 표
  blocks: Record<string, string>;
  order: string[]; // 섹션 표시 순서 (FORMATS의 markers key 순서)
  createdAt: Date;
}

// 리포트를 A4 PDF로 — 당근 채팅 등에서 파일로 바로 전달하기 위한 산출물
export async function buildReportPdf(input: PdfInput): Promise<Buffer> {
  const font = await loadFont();
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 64, bottom: 64, left: 56, right: 56 },
    info: {
      Title: `${input.persons[0].name}님의 ${input.productName}`,
      Author: SITE.brandFull,
    },
  });
  doc.registerFont("kr", font);
  doc.font("kr");

  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const finished = new Promise<void>((resolve) => doc.on("end", () => resolve()));

  const W = doc.page.width - 56 * 2;

  // ── 표지 ────────────────────────────────────────────────
  doc.moveDown(4);
  doc.fontSize(11).fillColor(ACCENT).text(SITE.brandFull, { align: "center" });
  doc.moveDown(1.5);
  doc.fontSize(26).fillColor(INK).text(input.productName, { align: "center" });
  doc.moveDown(0.8);
  const who =
    input.persons.length === 2
      ? `${input.persons[0].name} ♥ ${input.persons[1].name}`
      : `${input.persons[0].name}님`;
  doc.fontSize(16).fillColor(SOFT).text(who, { align: "center" });

  doc.moveDown(3);
  // 사주팔자 표 (년/월/일/시)
  const p = input.saju.pillars;
  const cols = [
    { label: "시주", v: p.hour ? `${p.hour.hangul}\n${p.hour.hanja}` : "미상\n―" },
    { label: "일주", v: `${p.day.hangul}\n${p.day.hanja}` },
    { label: "월주", v: `${p.month.hangul}\n${p.month.hanja}` },
    { label: "년주", v: `${p.year.hangul}\n${p.year.hanja}` },
  ];
  const cw = W / 4;
  const top = doc.y;
  cols.forEach((c, i) => {
    const x = 56 + cw * i;
    doc.fontSize(9).fillColor(SOFT).text(c.label, x, top, { width: cw, align: "center" });
    doc.fontSize(15).fillColor(INK).text(c.v, x, top + 16, { width: cw, align: "center" });
  });
  doc.y = top + 62;
  doc
    .fontSize(9)
    .fillColor(SOFT)
    .text(
      `일간(나) ${input.saju.dayMaster.char} · ${input.saju.dayMaster.yinyang}${input.saju.dayMaster.element} — 만세력 데이터로 계산된 값이에요`,
      56,
      doc.y,
      { width: W, align: "center" },
    );

  // 오행 분포
  doc.moveDown(1.5);
  const dist = input.saju.elementDist.map((e) => `${e.name} ${e.count.toFixed(1)}`).join("   ");
  doc.fontSize(11).fillColor(INK).text(dist, { width: W, align: "center" });

  // 대운 시간표 (있으면)
  if (input.saju.daewoon) {
    doc.moveDown(2);
    doc.fontSize(9).fillColor(SOFT).text("인생 국면(대운) 시간표", { width: W, align: "center" });
    doc.moveDown(0.4);
    const dw = input.saju.daewoon.pillars
      .map((d) => `${d.startAge}~${d.endAge}세 ${d.hangul}`)
      .join("   ·   ");
    doc.fontSize(9.5).fillColor(INK).text(dw, { width: W, align: "center" });
  }

  doc.fontSize(9).fillColor(SOFT);
  doc.text(
    `${input.createdAt.getFullYear()}.${String(input.createdAt.getMonth() + 1).padStart(2, "0")}.${String(input.createdAt.getDate()).padStart(2, "0")} 발행`,
    56,
    doc.page.height - 96,
    { width: W, align: "center" },
  );

  // ── 본문 ────────────────────────────────────────────────
  for (const key of input.order) {
    const body = input.blocks[key];
    if (!body?.trim()) continue;
    doc.addPage();
    doc.fontSize(9).fillColor(ACCENT).text(input.productName, { width: W });
    doc.moveDown(0.6);
    doc.fontSize(19).fillColor(INK).text(key, { width: W });
    doc.moveDown(0.3);
    const y = doc.y;
    doc.moveTo(56, y).lineTo(56 + W, y).strokeColor(LINE).lineWidth(1).stroke();
    doc.moveDown(1);
    doc.fontSize(11).fillColor(INK).text(body.trim(), { width: W, align: "left", lineGap: 6 });
  }

  // ── 안내 ────────────────────────────────────────────────
  doc.addPage();
  doc.moveDown(2);
  doc.fontSize(19).fillColor(INK).text("읽어주셔서 고맙습니다", { width: W });
  doc.moveDown(1);
  doc
    .fontSize(11)
    .fillColor(INK)
    .text(
      "이 리포트의 사주팔자는 만세력 데이터(1900~2050년, 절기·음력 변환 포함)를 기반으로 한 결정론적 알고리즘으로 계산했습니다. 다른 만세력 서비스와 대조해보셔도 같은 값이 나와요.\n\n" +
        "해석문은 위 계산값만을 근거로 생성형 AI가 작성했습니다. 재미와 자기 이해를 위한 콘텐츠이며, 의료·법률·투자 판단의 근거가 될 수 없습니다.",
      { width: W, lineGap: 6 },
    );
  doc.moveDown(2);
  doc.fontSize(10).fillColor(SOFT).text(
    `${SITE.brandFull}\n사업자등록번호 ${SITE.bizNumber} · 대표 ${SITE.ownerName}\n문의 ${SITE.email}`,
    { width: W, lineGap: 4 },
  );

  doc.end();
  await finished;
  return Buffer.concat(chunks);
}

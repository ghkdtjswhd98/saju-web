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
    // 목차의 쪽번호와 하단 "n / 총쪽수"는 전체 쪽수를 다 알아야 쓸 수 있다.
    // bufferPages로 페이지를 붙들어 두고, 본문을 다 그린 뒤 되돌아가서 채운다.
    bufferPages: true,
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

  // ── 목차 ────────────────────────────────────────────────
  // 무형 상품의 부피를 한 장으로 물성화하는 장치. 상위 업체 10곳 중 5곳이 갤러리에
  // 목차 이미지를 올려두고, 판매 문구의 항목 리스트와 실물을 대조시킨다.
  const sections = input.order.filter((k) => input.blocks[k]?.trim());
  doc.addPage();
  doc.fontSize(9).fillColor(ACCENT).text(SITE.brandFull, 56, 64, { width: W });
  doc.moveDown(0.6);
  doc.fontSize(19).fillColor(INK).text("목차", 56, doc.y, { width: W });
  doc.moveDown(0.4);
  {
    const y = doc.y;
    doc.moveTo(56, y).lineTo(56 + W, y).strokeColor(LINE).lineWidth(1).stroke();
  }
  doc.moveDown(1.2);
  // 쪽번호는 아직 모른다 — y좌표만 적어두고 본문을 다 그린 뒤 되돌아와 채운다
  const tocRows: { key: string; y: number }[] = [];
  for (const key of sections) {
    const y = doc.y;
    // 점선 리더를 먼저 깔고 그 위에 항목명을 얹는다 (순서가 반대면 글자가 점선에 뭉개진다)
    doc.fontSize(11).fillColor(LINE).text(".".repeat(90), 56, y, {
      width: W - 44,
      align: "right",
      lineBreak: false,
    });
    doc.fontSize(11.5).fillColor(INK).text(key, 56, y, { width: W - 60, align: "left" });
    tocRows.push({ key, y });
    doc.y = y + 26;
  }
  // 정렬 옵션이 붙은 text()는 doc.x를 옮겨놓는다. 여기서 되돌리지 않으면
  // 이후 본문이 좁은 단으로 흘러 쪽수가 3배로 불어난다(실제로 26쪽 → 79쪽이 났다).
  doc.x = 56;
  const tocPageIndex = doc.bufferedPageRange().count - 1;

  // ── 본문 ────────────────────────────────────────────────
  const sectionStartPage: Record<string, number> = {};
  for (const key of sections) {
    const body = input.blocks[key];
    doc.addPage();
    sectionStartPage[key] = doc.bufferedPageRange().count - 1;
    // x를 매번 명시한다 — doc.x에 기대면 앞선 정렬 텍스트에 밀려 단이 좁아진다
    doc.fontSize(9).fillColor(ACCENT).text(input.productName, 56, 64, { width: W });
    doc.moveDown(0.6);
    doc.fontSize(19).fillColor(INK).text(key, 56, doc.y, { width: W });
    doc.moveDown(0.3);
    const y = doc.y;
    doc.moveTo(56, y).lineTo(56 + W, y).strokeColor(LINE).lineWidth(1).stroke();
    doc.moveDown(1);
    doc
      .fontSize(11)
      .fillColor(INK)
      .text(body.trim(), 56, doc.y, { width: W, align: "left", lineGap: 6 });
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

  // ── 되돌아가서 채우기 ───────────────────────────────────
  const total = doc.bufferedPageRange().count;

  // 목차 쪽번호 (사람이 세는 번호라 1부터)
  doc.switchToPage(tocPageIndex);
  for (const row of tocRows) {
    doc
      .fontSize(11.5)
      .fillColor(ACCENT)
      .text(String(sectionStartPage[row.key] + 1), 56, row.y, {
        width: W,
        align: "right",
        lineBreak: false,
      });
  }

  // 하단 쪽번호 "n / 총쪽수" — 표지(0쪽)는 비운다.
  // 고객이 캡처해 후기에 올릴 때 분량이 화면 안 숫자로 증명된다(경쟁사 4곳이 쓰는 장치).
  //
  // ⚠️ 바닥 여백 안쪽이 아니면 pdfkit이 "넘쳤다"고 판단해 페이지를 새로 만든다.
  //    쪽마다 두 줄을 쓰므로 26쪽짜리가 79쪽으로 불어났었다. 여백을 0으로 내리고 쓴 뒤 되돌린다.
  const bottomMargin = doc.page.margins.bottom;
  for (let i = 1; i < total; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0;
    doc
      .fontSize(8.5)
      .fillColor(SOFT)
      .text(`${i + 1} / ${total}`, 56, doc.page.height - 44, {
        width: W,
        align: "center",
        lineBreak: false,
      });
    doc
      .fontSize(8.5)
      .fillColor(LINE)
      .text(SITE.brandName, 56, doc.page.height - 44, {
        width: W,
        align: "right",
        lineBreak: false,
      });
    doc.page.margins.bottom = bottomMargin;
  }

  doc.flushPages();
  doc.end();
  await finished;
  return Buffer.concat(chunks);
}

import PDFDocument from "pdfkit";
import { SITE } from "@/lib/site";
import { BRANCH_ELEMENT, STEM_ELEMENT } from "@/lib/saju/constants";
import { yearlyFlow, type MonthFlow } from "@/lib/saju/flow-score";
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
// 프리미엄화 2차 (2026-09-02, docs/benchmark-wealth-pdf.md) — 딥퍼플+금박 프레임 팔레트
const GOLD = "#c1a05f";
const COVER_BG = "#2d2350";
const COVER_SOFT = "#c3b8ea";

// 오행별 글자색 — 흰 배경용 / 어두운 표지용 (화=적, 수=흑청, 목=녹, 금=회금, 토=황토)
const ELEMENT_COLOR: Record<string, string> = {
  화: "#c0453b", 수: "#33475e", 목: "#2f7d5d", 금: "#8a8f98", 토: "#b07d2e",
};
const ELEMENT_COLOR_DARK: Record<string, string> = {
  화: "#ff9188", 수: "#9db8d8", 목: "#7fd4ae", 금: "#d7dce4", 토: "#ffd27f",
};
function stemColor(ch: string, dark = false): string {
  const el = STEM_ELEMENT[ch];
  return (dark ? ELEMENT_COLOR_DARK : ELEMENT_COLOR)[el] ?? (dark ? "#ffffff" : INK);
}
function branchColor(ch: string, dark = false): string {
  const el = BRANCH_ELEMENT[ch];
  return (dark ? ELEMENT_COLOR_DARK : ELEMENT_COLOR)[el] ?? (dark ? "#ffffff" : INK);
}

// 챕터 구성 — "제N장" 오프너마다 원국표를 다시 싣는다 (경쟁사 최고 장치의 우리 버전).
// key는 FORMATS marker.key와 일치해야 한다. 미정의 상품은 오프너 없이 기존 흐름.
interface Chapter { at: string; n: number; title: string; quote: string }
const CHAPTERS: Record<string, Chapter[]> = {
  deep: [
    { at: "먼저 맞혀볼게요", n: 1, title: "나라는 사람", quote: "이 리포트의 모든 문장은 위 여덟 글자에서 나옵니다" },
    { at: "재물운", n: 2, title: "돈 · 일 · 사랑", quote: "재물과 일의 그릇은 타고난 구조가 먼저 정합니다" },
    { at: "건강운", n: 3, title: "몸 · 사람 · 시간", quote: "관계와 컨디션에도 타고난 리듬이 있습니다" },
    { at: "올해와 내년", n: 4, title: "앞으로", quote: "시간표를 아는 사람은 서두르지 않습니다" },
  ],
  lifetime: [
    { at: "총평", n: 1, title: "나라는 사람", quote: "이 리포트의 모든 문장은 위 여덟 글자에서 나옵니다" },
    { at: "재물운", n: 2, title: "삶의 네 영역", quote: "돈·일·사랑·몸은 하나의 구조가 다르게 드러난 것입니다" },
    { at: "인생흐름", n: 3, title: "시간과 실천", quote: "흐름을 알면 오늘 할 일이 선명해집니다" },
  ],
  year: [
    { at: "올해총평", n: 1, title: "올해의 지형", quote: "올해의 기운이 내 구조와 만나 흐름이 됩니다" },
    { at: "월별흐름", n: 2, title: "월별 시간표", quote: "타이밍은 준비된 사람의 것입니다" },
  ],
  career: [
    { at: "총평", n: 1, title: "나의 일의 결", quote: "맞는 일은 재능이 아니라 구조가 알려줍니다" },
    { at: "재물그릇", n: 2, title: "재물과 타이밍", quote: "그릇을 알면 조급함이 줄어듭니다" },
  ],
  love: [
    { at: "케미총평", n: 1, title: "두 사람의 케미", quote: "끌림에는 두 사주가 만든 이유가 있습니다" },
    { at: "끌림", n: 2, title: "가까워지는 법", quote: "다름을 아는 것이 케미의 시작입니다" },
  ],
  reunion: [
    { at: "지금의기운", n: 1, title: "지금의 두 사람", quote: "듣고 싶은 답이 아니라, 있는 그대로의 흐름을 봅니다" },
    { at: "달라져야할것", n: 2, title: "다시 시작한다면", quote: "재회는 반복이 아니라 다른 시작이어야 합니다" },
  ],
  marriage: [
    { at: "결혼운총평", n: 1, title: "나의 결혼 지도", quote: "배우자의 결은 내 구조가 먼저 말해줍니다" },
    { at: "나의패턴", n: 2, title: "준비하는 시간", quote: "시기를 아는 것보다 준비가 먼저입니다" },
  ],
  dohwa: [
    { at: "판정결과", n: 1, title: "판정과 구조", quote: "매력은 미신이 아니라 구조입니다" },
    { at: "연애도화", n: 2, title: "연애와 올해", quote: "빛나는 순간은 아는 사람에게 옵니다" },
  ],
  crush: [
    { at: "지금의온도", n: 1, title: "지금의 온도", quote: "짐작 대신, 두 사주의 실제 교차를 봅니다" },
    { at: "머뭇거림", n: 2, title: "다가가는 법", quote: "속도보다 결이 맞아야 닿습니다" },
  ],
};

export interface PdfInput {
  productName: string;
  productCode?: string; // 챕터 오프너·월별 차트 분기용 (없으면 기본 흐름)
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
  const PW = doc.page.width;
  const PH = doc.page.height;

  // ── 금박 프레임 — 표지를 제외한 모든 페이지에 그린다 ─────
  // (경쟁사는 일러스트 테두리로 프리미엄 체감을 만들었다 — 우리는 절제된 이중 룰 프레임)
  let frameOn = false;
  const paintFrame = () => {
    if (!frameOn) return;
    doc.save();
    doc.rect(22, 22, PW - 44, PH - 44).lineWidth(1.4).strokeColor(GOLD).stroke();
    doc.rect(27, 27, PW - 54, PH - 54).lineWidth(0.5).strokeColor(ACCENT).strokeOpacity(0.45).stroke();
    doc.strokeOpacity(1);
    // 모서리 금박 포인트
    for (const [cx, cy] of [[22, 22], [PW - 22, 22], [22, PH - 22], [PW - 22, PH - 22]] as const) {
      doc.circle(cx, cy, 2.2).fillColor(GOLD).fill();
    }
    doc.restore();
  };
  doc.on("pageAdded", paintFrame);

  // ── 표지 — 딥퍼플 + 금박 프리미엄 ───────────────────────
  doc.rect(0, 0, PW, PH).fillColor(COVER_BG).fill();
  doc.rect(30, 30, PW - 60, PH - 60).lineWidth(1.2).strokeColor(GOLD).stroke();
  doc.y = 128;
  doc.fontSize(12).fillColor(GOLD).text(SITE.brandFull, 56, doc.y, { width: W, align: "center", characterSpacing: 6 });
  doc.moveDown(1.8);
  doc.fontSize(27).fillColor("#ffffff").text(input.productName, 56, doc.y, { width: W, align: "center" });
  doc.moveDown(0.8);
  const who =
    input.persons.length === 2
      ? `${input.persons[0].name} ♥ ${input.persons[1].name}`
      : `${input.persons[0].name}님`;
  doc.fontSize(16).fillColor(COVER_SOFT).text(who, 56, doc.y, { width: W, align: "center" });

  doc.moveDown(3);
  // 사주팔자 표 (년/월/일/시) — 오행별 색으로
  const p = input.saju.pillars;
  const cols = [
    { label: "시주", pl: p.hour },
    { label: "일주", pl: p.day },
    { label: "월주", pl: p.month },
    { label: "년주", pl: p.year },
  ];
  const cw = W / 4;
  const top = doc.y;
  cols.forEach((c, i) => {
    const x = 56 + cw * i;
    doc.fontSize(9).fillColor(COVER_SOFT).text(c.label, x, top, { width: cw, align: "center" });
    if (c.pl) {
      const stem = c.pl.hangul.charAt(0);
      const branch = c.pl.hangul.charAt(1);
      doc.fontSize(17).fillColor(stemColor(stem, true)).text(stem, x, top + 17, { width: cw / 2 - 3, align: "right", lineBreak: false });
      doc.fontSize(17).fillColor(branchColor(branch, true)).text(branch, x + cw / 2 + 3, top + 17, { width: cw / 2 - 3, align: "left", lineBreak: false });
      doc.fontSize(11).fillColor(COVER_SOFT).text(c.pl.hanja, x, top + 40, { width: cw, align: "center" });
    } else {
      doc.fontSize(17).fillColor(COVER_SOFT).text("미상", x, top + 17, { width: cw, align: "center" });
    }
  });
  doc.y = top + 68;
  doc.x = 56;
  doc
    .fontSize(9)
    .fillColor(COVER_SOFT)
    .text(
      `일간(나) ${input.saju.dayMaster.char} · ${input.saju.dayMaster.yinyang}${input.saju.dayMaster.element} — 만세력 데이터로 계산된 값이에요`,
      56,
      doc.y,
      { width: W, align: "center" },
    );

  // 오행 분포
  doc.moveDown(1.5);
  const dist = input.saju.elementDist.map((e) => `${e.name} ${e.count.toFixed(1)}`).join("   ");
  doc.fontSize(11).fillColor("#ffffff").text(dist, 56, doc.y, { width: W, align: "center" });

  // 대운 시간표 (있으면)
  if (input.saju.daewoon) {
    doc.moveDown(2);
    doc.fontSize(9).fillColor(GOLD).text("인생 국면(대운) 시간표", 56, doc.y, { width: W, align: "center" });
    doc.moveDown(0.4);
    const dw = input.saju.daewoon.pillars
      .map((d) => `${d.startAge}~${d.endAge}세 ${d.hangul}`)
      .join("   ·   ");
    doc.fontSize(9.5).fillColor(COVER_SOFT).text(dw, 56, doc.y, { width: W, align: "center" });
  }

  doc.fontSize(9).fillColor(COVER_SOFT);
  doc.text(
    `${input.createdAt.getFullYear()}.${String(input.createdAt.getMonth() + 1).padStart(2, "0")}.${String(input.createdAt.getDate()).padStart(2, "0")} 발행`,
    56,
    PH - 96,
    { width: W, align: "center" },
  );
  // 표지 이후 페이지부터 프레임 활성화
  frameOn = true;

  // ── 사주 데이터 페이지 (2026-08-31 추가) ─────────────────
  // 표지에 압축돼 있던 결정론적 계산값을 제대로 된 페이지로 펼친다.
  // 페이지 수(=무형 상품의 유일한 부피 시그널)를 AI 비용 0원으로 늘리면서,
  // "계산은 만세력으로 정확하게"라는 브랜드 약속을 실물로 보여주는 장치.
  const pageHeader = (label: string) => {
    doc.addPage();
    doc.fontSize(9).fillColor(ACCENT).text(input.productName, 56, 64, { width: W });
    doc.moveDown(0.6);
    doc.fontSize(19).fillColor(INK).text(label, 56, doc.y, { width: W });
    doc.moveDown(0.3);
    const hy = doc.y;
    doc.moveTo(56, hy).lineTo(56 + W, hy).strokeColor(LINE).lineWidth(1).stroke();
    doc.moveDown(1);
  };

  // [데이터 1] 사주팔자 표 — 크게, 지장간 포함
  pageHeader("나의 사주팔자");
  {
    const cw2 = W / 4;
    const top2 = doc.y + 6;
    const colDefs = [
      { label: "시주", pl: p.hour },
      { label: "일주", pl: p.day },
      { label: "월주", pl: p.month },
      { label: "년주", pl: p.year },
    ];
    colDefs.forEach((c, i) => {
      const x = 56 + cw2 * i;
      doc.fontSize(10).fillColor(SOFT).text(c.label, x, top2, { width: cw2, align: "center" });
      doc
        .fontSize(24)
        .fillColor(INK)
        .text(c.pl ? c.pl.hangul : "미상", x, top2 + 20, { width: cw2, align: "center" });
      doc
        .fontSize(14)
        .fillColor(SOFT)
        .text(c.pl ? c.pl.hanja : "―", x, top2 + 52, { width: cw2, align: "center" });
    });
    doc.y = top2 + 92;
    doc.x = 56;
    doc
      .fontSize(11)
      .fillColor(INK)
      .text(
        `일간(나를 나타내는 글자): ${input.saju.dayMaster.char} — ${input.saju.dayMaster.yinyang}${input.saju.dayMaster.element}의 기운`,
        56, doc.y, { width: W, lineGap: 6 },
      );
    doc.moveDown(1);
    doc
      .fontSize(10)
      .fillColor(SOFT)
      .text(
        "이 여덟 글자는 만세력 데이터(1900~2050년, 절기·음력 변환 포함) 기반의 결정론적 알고리즘으로 계산됐어요. 같은 생년월일시라면 언제 다시 계산해도 같은 값이 나오고, 다른 만세력 서비스와 대조해도 일치합니다. AI는 이 계산에 관여하지 않아요 — 해석만 담당합니다.",
        56, doc.y, { width: W, lineGap: 5 },
      );
  }

  // [데이터 2] 오행 분포 막대 그래프
  pageHeader("나의 오행 분포");
  {
    const maxCount = Math.max(...input.saju.elementDist.map((e) => e.count), 1);
    const barMaxW = W - 130;
    let by = doc.y + 4;
    for (const e of input.saju.elementDist) {
      doc.fontSize(11).fillColor(INK).text(`${e.name}`, 56, by + 2, { width: 60 });
      const bw = Math.max((e.count / maxCount) * barMaxW, 3);
      doc.rect(120, by, bw, 16).fillColor(ACCENT).fillOpacity(0.75).fill();
      doc.fillOpacity(1);
      doc.fontSize(10).fillColor(SOFT).text(e.count.toFixed(1), 126 + bw, by + 2, { lineBreak: false });
      by += 30;
    }
    doc.x = 56;
    doc.y = by + 10;
    doc
      .fontSize(10)
      .fillColor(SOFT)
      .text(
        "가중치: 천간 1.0 · 지지 본기 1.0 · 지장간 중기 0.3 · 여기 0.2. 몰려 있는 기운은 그 사람의 엔진이 되고, 부족한 기운은 평생의 과제가 됩니다 — 본문 해석의 근거가 전부 이 분포에서 나와요.",
        56, doc.y, { width: W, lineGap: 5 },
      );
  }

  // [데이터 3] 십신·신살·대운 시간표
  pageHeader("십신 구성과 시간표");
  {
    doc.fontSize(11).fillColor(INK).text("십신(각 글자가 나에게 갖는 역할)", 56, doc.y, { width: W });
    doc.moveDown(0.5);
    for (const s of input.saju.sipsin) {
      doc
        .fontSize(10)
        .fillColor(SOFT)
        .text(`${s.position}  ${s.char}  —  ${s.label}`, 64, doc.y, { width: W - 8, lineGap: 3 });
    }
    if (input.saju.sinsal.length) {
      doc.moveDown(1);
      doc.fontSize(11).fillColor(INK).text("신살", 56, doc.y, { width: W });
      doc.moveDown(0.4);
      doc.fontSize(10).fillColor(SOFT).text(input.saju.sinsal.join(" · "), 64, doc.y, { width: W - 8 });
    }
    if (input.saju.daewoon) {
      doc.moveDown(1);
      doc.fontSize(11).fillColor(INK).text("인생 국면(대운) 시간표 — 10년 단위", 56, doc.y, { width: W });
      doc.moveDown(0.5);
      for (const d of input.saju.daewoon.pillars) {
        doc
          .fontSize(10)
          .fillColor(SOFT)
          .text(`${String(d.startAge).padStart(2, " ")}세 ~ ${d.endAge}세   ${d.hangul} (${d.hanja})`, 64, doc.y, {
            width: W - 8,
            lineGap: 3,
          });
      }
    }
    doc.x = 56;
  }

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

  // ── 챕터 오프너 — 원국표를 장마다 다시 싣는다 ───────────
  const renderPillarRow = (yBase: number) => {
    const cw3 = W / 4;
    cols.forEach((c, i) => {
      const x = 56 + cw3 * i;
      doc.fontSize(9).fillColor(SOFT).text(c.label, x, yBase, { width: cw3, align: "center" });
      if (c.pl) {
        const stem = c.pl.hangul.charAt(0);
        const branch = c.pl.hangul.charAt(1);
        doc.fontSize(20).fillColor(stemColor(stem)).text(stem, x, yBase + 16, { width: cw3 / 2 - 4, align: "right", lineBreak: false });
        doc.fontSize(20).fillColor(branchColor(branch)).text(branch, x + cw3 / 2 + 4, yBase + 16, { width: cw3 / 2 - 4, align: "left", lineBreak: false });
        doc.fontSize(11).fillColor(SOFT).text(c.pl.hanja, x, yBase + 44, { width: cw3, align: "center" });
      } else {
        doc.fontSize(20).fillColor(SOFT).text("미상", x, yBase + 16, { width: cw3, align: "center" });
      }
    });
    doc.x = 56;
    doc.y = yBase + 72;
  };

  const renderChapterOpener = (ch: Chapter) => {
    doc.addPage();
    doc.y = 150;
    doc.fontSize(12).fillColor(GOLD).text(`제 ${ch.n} 장`, 56, doc.y, { width: W, align: "center", characterSpacing: 4 });
    doc.moveDown(0.6);
    doc.fontSize(24).fillColor(INK).text(ch.title, 56, doc.y, { width: W, align: "center" });
    doc.moveDown(2.5);
    renderPillarRow(doc.y);
    doc.moveDown(0.8);
    doc
      .fontSize(9)
      .fillColor(SOFT)
      .text(
        `${input.persons[0].name}님의 사주팔자 (만세력 계산값${input.persons.length === 2 ? " · 신청자 기준" : ""})`,
        56, doc.y, { width: W, align: "center" },
      );
    // 하단 한 줄 명제 — 이 장의 읽기 렌즈
    const qy = PH - 170;
    doc.rect(56, qy, W, 40).fillColor("#f4f1ec").fill();
    doc.fontSize(11).fillColor(ACCENT).text(`“${ch.quote}”`, 56, qy + 13, { width: W, align: "center" });
  };

  // ── 월별 흐름 지수 차트 — 결정론 값 (합·충·형 밀도) ─────
  const renderFlowChart = (years: number[]) => {
    doc.addPage();
    doc.fontSize(9).fillColor(ACCENT).text(input.productName, 56, 64, { width: W });
    doc.moveDown(0.6);
    doc.fontSize(19).fillColor(INK).text(`월별 흐름 지수 (${years.join("·")})`, 56, doc.y, { width: W });
    doc.moveDown(0.3);
    const hy = doc.y;
    doc.moveTo(56, hy).lineTo(56 + W, hy).strokeColor(LINE).lineWidth(1).stroke();

    const flows: (MonthFlow & { year: number })[] = years.flatMap((y) =>
      yearlyFlow(input.saju, y).map((m) => ({ ...m, year: y })),
    );
    const chartX = 70;
    const chartW = W - 30;
    const chartTop = hy + 34;
    const chartH = 190;
    const yOf = (score: number) => chartTop + chartH - ((score - 0) / 100) * chartH;
    const xOf = (i: number) => chartX + (chartW / (flows.length - 1)) * i;

    // 가이드 라인 (상승 60 / 주의 40)
    for (const [v, label] of [[60, "상승"], [40, "주의"]] as const) {
      const gy = yOf(v);
      doc.moveTo(chartX, gy).lineTo(chartX + chartW, gy).dash(3, { space: 3 }).strokeColor(LINE).lineWidth(0.8).stroke().undash();
      doc.fontSize(7.5).fillColor(SOFT).text(`${v} ${label}`, chartX - 14, gy - 4, { width: 40, lineBreak: false });
    }
    // 꺾은선 — 구간 색은 두 점의 평균 밴드
    const bandColor = { up: "#2f7d5d", mid: "#b07d2e", watch: "#c0453b" } as const;
    for (let i = 1; i < flows.length; i++) {
      const avg = (flows[i - 1].score + flows[i].score) / 2;
      const color = avg >= 60 ? bandColor.up : avg >= 40 ? bandColor.mid : bandColor.watch;
      doc.moveTo(xOf(i - 1), yOf(flows[i - 1].score)).lineTo(xOf(i), yOf(flows[i].score))
        .lineWidth(2).strokeColor(color).stroke();
    }
    flows.forEach((f, i) => {
      doc.circle(xOf(i), yOf(f.score), 2.4).fillColor(bandColor[f.band]).fill();
      const every = flows.length > 12 ? 3 : 1;
      if (i % every === 0) {
        doc.fontSize(7).fillColor(SOFT).text(
          flows.length > 12 ? `${String(f.year).slice(2)}.${f.month}` : `${f.month}월`,
          xOf(i) - 12, chartTop + chartH + 6, { width: 26, align: "center", lineBreak: false },
        );
      }
    });

    // TOP 3 — 지수 상위 달
    const top3 = [...flows].sort((a, b) => b.score - a.score).slice(0, 3);
    doc.x = 56;
    doc.y = chartTop + chartH + 30;
    doc.fontSize(12).fillColor(INK).text(
      `기회의 달 TOP 3:  ${top3.map((t) => `${t.year}년 ${t.month}월 (${t.score})`).join("  ·  ")}`,
      56, doc.y, { width: W },
    );
    doc.moveDown(1);
    doc
      .fontSize(9)
      .fillColor(SOFT)
      .text(
        "이 지수는 각 달의 월건(月建) 지지가 내 사주 지지와 만드는 합(끌어주는 기운)·충(부딪히는 기운)·형의 밀도를 점수화한 결정론 값이에요. 같은 사주라면 언제 다시 계산해도 같은 곡선이 나옵니다. 높은 달은 판을 벌리기에, 낮은 달은 다지기에 유리한 경향으로 읽어주세요 — 확정 예언이 아니라 리듬의 지도입니다.",
        56, doc.y, { width: W, lineGap: 5 },
      );
  };

  // ── 본문 ────────────────────────────────────────────────
  const chapters = input.productCode ? (CHAPTERS[input.productCode] ?? []) : [];
  const sectionStartPage: Record<string, number> = {};
  for (const key of sections) {
    const body = input.blocks[key];
    const ch = chapters.find((c) => c.at === key);
    if (ch) renderChapterOpener(ch);
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
    // 11.5pt/행간 7 — 모바일 캡처 가독성을 올리면서 장문 섹션이 자연스럽게 2쪽에 걸치게 (2026-08-31)
    doc
      .fontSize(11.5)
      .fillColor(INK)
      .text(body.trim(), 56, doc.y, { width: W, align: "left", lineGap: 7 });

    // 월별 흐름 차트 — 시간을 다루는 섹션 뒤에 결정론 차트를 붙인다
    if (input.productCode === "year" && key === "월별흐름") {
      renderFlowChart([input.saju.currentYear]);
    } else if (input.productCode === "deep" && key === "올해와 내년") {
      renderFlowChart([input.saju.currentYear, input.saju.currentYear + 1]);
    }
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

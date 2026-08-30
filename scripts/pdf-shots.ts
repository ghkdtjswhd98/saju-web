/**
 * PDF 페이지 → PNG 캡처. 당근 프로필 사진 슬롯용.
 *   npx tsx scripts/pdf-shots.ts <pdf경로> <출력폴더> [페이지번호...]
 *
 * 페이지 번호를 주지 않으면 표지·목차·본문 몇 장 + 전체 컨택트시트를 만든다.
 * 당근 갤러리는 정사각형에 가깝게 잘리므로 여백을 넉넉히 두지 않는다.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";

const SCALE = 2.2; // A4 기준 약 1300px 폭 — 당근 업로드에 충분하고 글자가 또렷하다

async function loadPdf(path: string) {
  // pdfjs는 ESM 전용 빌드를 쓴다(legacy 빌드는 Node에서 DOMMatrix 등을 요구)
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(readFileSync(path));
  return pdfjs.getDocument({ data, useSystemFonts: true }).promise;
}

async function renderPage(doc: any, pageNo: number, scale = SCALE) {
  const page = await doc.getPage(pageNo);
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext("2d");
  // 배경을 흰색으로 깔지 않으면 투명 PNG가 나와 당근에서 검게 보인다
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx as any, viewport, canvas: canvas as any }).promise;
  return canvas;
}

async function main() {
  const [pdfPath, outDir, ...pageArgs] = process.argv.slice(2);
  if (!pdfPath || !outDir) {
    console.error("사용법: npx tsx scripts/pdf-shots.ts <pdf> <출력폴더> [페이지...]");
    process.exit(1);
  }
  mkdirSync(outDir, { recursive: true });

  const doc = await loadPdf(pdfPath);
  const total = doc.numPages;
  console.log(`총 ${total}쪽`);

  const pages = pageArgs.length
    ? pageArgs.map(Number)
    : [1, 2, 3, Math.ceil(total / 2), total - 1];

  for (const n of pages) {
    if (n < 1 || n > total) continue;
    const canvas = await renderPage(doc, n);
    const file = join(outDir, `page-${String(n).padStart(2, "0")}.png`);
    writeFileSync(file, canvas.toBuffer("image/png"));
    console.log(`✅ ${file}  (${canvas.width}×${canvas.height})`);
  }

  // 컨택트시트 — 전 페이지를 격자로. "26페이지"라는 말을 눈으로 대체하는 장치.
  const COLS = 6;
  const rows = Math.ceil(total / COLS);
  const thumb = await renderPage(doc, 1, 0.45);
  const tw = thumb.width;
  const th = thumb.height;
  const GAP = 10;
  const PAD = 24;
  const sheet = createCanvas(PAD * 2 + COLS * tw + (COLS - 1) * GAP, PAD * 2 + rows * th + (rows - 1) * GAP);
  const sctx = sheet.getContext("2d");
  sctx.fillStyle = "#faf7f2";
  sctx.fillRect(0, 0, sheet.width, sheet.height);
  for (let i = 0; i < total; i++) {
    const c = await renderPage(doc, i + 1, 0.45);
    const x = PAD + (i % COLS) * (tw + GAP);
    const y = PAD + Math.floor(i / COLS) * (th + GAP);
    sctx.drawImage(c as any, x, y);
    sctx.strokeStyle = "#e4ded6";
    sctx.lineWidth = 1;
    sctx.strokeRect(x + 0.5, y + 0.5, tw - 1, th - 1);
  }
  const sheetFile = join(outDir, "contact-sheet.png");
  writeFileSync(sheetFile, sheet.toBuffer("image/png"));
  console.log(`✅ ${sheetFile}  (${sheet.width}×${sheet.height})  ${total}쪽 전체`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

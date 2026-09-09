// 토스페이먼츠 계약심사용 결제경로 PPT 생성기
// 사용: node build-ppt.js <캡처폴더> [출력파일]
//   캡처폴더에 step1.png ~ step6.png (전체화면 캡처: 브라우저 주소창의 도메인 + 윈도우 작업표시줄 시계가 보여야 함)
const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

const dir = process.argv[2] || ".";
const out = process.argv[3] || path.join(dir, "오롭미_결제경로.pptx");
const DOMAIN = "https://saju-web-orobmi.vercel.app";
const STEPS = [
  ["② 하단정보 — 사업자 정보 푸터", `${DOMAIN}/ 하단 — 상호명·대표자명·사업자등록번호·사업장주소·전화 (사업자등록증과 동일, 통신판매업 신고 면제 표기)`],
  ["③ 환불규정", `${DOMAIN}/refund — 환불 정책 페이지 (디지털 콘텐츠 청약철회 안내, 생성 실패 시 자동 환불)`],
  ["⑤ 상품선택·구매과정 (1) 메인 페이지", `${DOMAIN}/ — 상품 노출`],
  ["⑤ 상품선택·구매과정 (2) 상품 상세", `${DOMAIN}/products/deep — 상품명·가격·상세 설명`],
  ["⑤ 상품선택·구매과정 (3) 주문서", `${DOMAIN}/checkout/new?product=deep — 비회원 구매, 이름·생년월일·이메일 입력`],
  ["⑤ 상품선택·구매과정 (4) 결제 페이지", `${DOMAIN}/checkout/{주문번호} — 결제수단 안내 + '결제하기' 버튼(토스페이먼츠 결제창 호출)`],
  ["⑥ 카드 결제경로 (1) 카드사 선택", "토스페이먼츠 결제창 — 신용·체크카드 목록에서 비씨카드 선택, 약관 동의"],
  ["⑥ 카드 결제경로 (2) 비씨카드 인증창 호출", "비씨카드 선택 후 페이북(ISP) 인증창이 열린 화면"],
  ["⑥ 카드 결제경로 (3) 비씨카드 실제 결제 화면", "비씨카드 페이북 결제 방식 선택 화면 (앱 결제 · 비밀번호 결제 · 인증서 등록/결제) — 가이드 16페이지의 비씨카드 실제 결제 화면"],
  ["⑥ 카드 결제경로 (4) 결제 완료", `${DOMAIN}/report/{리포트번호} — 결제 승인 후 리포트 페이지`],
];
const FILES = ["footer.png", "refund.png", "step1.png", "step2.png", "step3.png", "step4.png", "cardlist.png", "step5.png", "paybooc-card.png", "step6.png"];

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
const NAVY = "272132", INK = "221F2B", SOFT = "6B6478", CARD = "F4F1EA";

// 표지
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  s.addText("오롭미 결제경로 (토스페이먼츠 계약심사용)", { x: 0.7, y: 1.2, w: 12, h: 1.0, fontFace: "Arial", fontSize: 34, bold: true, color: "FFFFFF", isTextBox: true, margin: 0 });
  s.addText("① 가맹점 정보", { x: 0.7, y: 2.3, w: 12, h: 0.5, fontFace: "Arial", fontSize: 18, bold: true, color: "FFE9A8", isTextBox: true, margin: 0 });
  s.addText([
    { text: "(1) 상호명 : 오롭미", options: { breakLine: true } },
    { text: "(2) 사업자등록번호 : 281-42-01423", options: { breakLine: true } },
    { text: `(3) URL : ${DOMAIN}`, options: { breakLine: true } },
    { text: "(4) 테스트 ID / PW : 없음 — 회원가입 없이 비회원 구매 (로그인·회원가입 경로 없음)", options: { breakLine: true } },
    { text: "상점아이디(MID) : vsajuw39i5  ·  대표자 : 황선종  ·  판매 상품 : 사주명리 해석 리포트(디지털 콘텐츠, 결제 후 15분 이내 즉시 발급)", options: { breakLine: true } },
    { text: `캡처일 : ${new Date().toLocaleDateString("ko-KR")}  ·  모든 화면은 브라우저 주소창(도메인)과 PC 시간이 함께 보이도록 전체 화면으로 캡처했습니다.` },
  ], { x: 0.7, y: 2.9, w: 12, h: 3.0, fontFace: "Arial", fontSize: 16, color: "CFC8DD", isTextBox: true, margin: 0, paraSpaceAfter: 6 });
}

STEPS.forEach(([title, desc], i) => {
  const s = pres.addSlide();
  s.background = { color: "FFFFFF" };
  s.addText(title, { x: 0.5, y: 0.35, w: 12.3, h: 0.6, fontFace: "Arial", fontSize: 24, bold: true, color: INK, isTextBox: true, margin: 0 });
  s.addText(desc, { x: 0.5, y: 0.95, w: 12.3, h: 0.4, fontFace: "Arial", fontSize: 12, color: SOFT, isTextBox: true, margin: 0 });
  const img = path.join(dir, FILES[i]);
  if (fs.existsSync(img)) {
    s.addImage({ path: img, x: 0.5, y: 1.45, w: 12.33, h: 5.7, sizing: { type: "contain", w: 12.33, h: 5.7 } });
  } else {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.45, w: 12.33, h: 5.7, fill: { color: CARD }, line: { color: "D9D1E6", width: 1 }, rectRadius: 0.15 });
    s.addText(`${FILES[i]} 캡처 필요`, { x: 0.5, y: 3.9, w: 12.33, h: 0.6, align: "center", fontFace: "Arial", fontSize: 18, color: SOFT, isTextBox: true });
  }
});

pres.writeFile({ fileName: out }).then(() => console.log("written:", out));

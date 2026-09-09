// 사업자/사이트 정보 — 푸터와 법적 고지 페이지의 진실의 원천
export const SITE = {
  brandName: "오롭미",
  brandFull: "오롭미 | All of Me",
  bizNumber: "281-42-01423",
  // 토스페이먼츠 심사 요건(2026-08-10 계약팀 메일): 하단 사업자정보는 등록증과 "완전 일치" —
  // 대표자명 한글, 주소는 동·호수까지. 영문 표기(노출 완화)는 심사 요건과 충돌해 한글로 전환.
  ownerName: "황선종",
  // ⚠️ 주소: 사업장 이전(웨스턴돔 작업실) 정정신고 진행 중 — 새 등록증 발급되면 그 표기 그대로 교체할 것
  // 토스 심사: 푸터 주소는 심사역이 가진 사업자등록증과 글자 단위로 같아야 한다.
  // 현재 등록증(2026-08-02 발급) 기준 한글 주소. 정정 등록증(파주)이 발급·제출되면 아래 줄로 교체:
  // address: "경기도 파주시 고봉로 755-27, 201-138호 (갤러리하우스상가)",
  address: "경기도 고양시 일산서구 홀트로 57, 404동 1205호(탄현동, 탄현마을)",
  // 업무 전용 회선 (알뜰폰 eSIM, 2026-08-18 개통) — 개인 번호와 분리
  phone: "010-8363-8551",
  email: "ghkdtjswhd98@gmail.com",
  // 통신판매업 신고: 간이과세자 면제 (공정거래위원회 고시 제2조 제1항)
  mailOrderNote: "통신판매업 신고 면제 사업자 (간이과세자)",
};

/**
 * 절대 URL 베이스 — 이메일 본문처럼 서버에서 링크를 만들 때 사용.
 * 메일에 localhost 링크가 나가면 고객이 리포트를 영영 못 여는 사고가 되므로,
 * env가 비어도 Vercel이 주입하는 배포 도메인으로 살아남게 한다.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

import type { ProductCode } from "@/lib/products";

// 포스터 대표 배경색 — 포스터 이미지가 로드되기 전 <img> 자리에 깔아 '완성된 카드'처럼 보이게 한다.
// love119 모바일 벤치마킹(권고 1, docs/benchmark-love119-mobile.md): 첫 방문자가 5~6초 흰 빈칸을 보던 문제.
// 값은 app/brand/poster/[code]/route.tsx ARTS의 bg 그라데이션 가운데 색(55% 지점)과 맞춘다 —
// 그쪽 아트 디렉션을 바꾸면 여기도 같이 고칠 것(빌드 의존을 끊으려 일부러 중복).
export const POSTER_BG: Record<ProductCode, string> = {
  reunion: "#1a2148",
  marriage: "#a8cdf0",
  love: "#ff9dbd",
  dohwa: "#3d0d1c",
  year: "#2763a8",
  career: "#14483a",
  lifetime: "#443a75",
  crush: "#f78bb1",
  deep: "#2e2a24",
  bundle: "#6b2fa0",
};

// 세로 포스터(app/brand/poster-portrait/[code]) 자리표시 색 — 홈 캐러셀·레일 전용.
// 세로판은 밤하늘 톤이라 가로판 값(핑크·하늘색)을 깔면 로드 전 색이 튄다. 값은 세로 ARTS.bg의 55% 지점.
export const POSTER_PORTRAIT_BG: Record<ProductCode, string> = {
  reunion: "#1a2148",
  marriage: "#274a70",
  love: "#48244a",
  dohwa: "#3d0d1c",
  year: "#1b467c",
  career: "#14483a",
  lifetime: "#443a75",
  crush: "#4f2e4e",
  deep: "#2b2340",
  bundle: "#58268a",
};

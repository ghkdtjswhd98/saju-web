// OG 이미지용 한글 폰트 — Google Fonts CSS API의 text= 서브셋으로 필요한 글자만 로드
// (Noto Sans KR 전체는 수 MB라 ImageResponse에 부적합)
export async function loadKoreanFont(text: string): Promise<ArrayBuffer> {
  const unique = Array.from(new Set(text)).join("");
  const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&text=${encodeURIComponent(unique)}`;
  // UA 헤더 없이 요청해야 ttf를 반환한다 (브라우저 UA를 주면 woff/woff2로 응답 —
  // 2026-08 확인: 구형 Firefox UA도 woff를 받게 바뀜. Satori는 ttf/otf/woff만 지원)
  const css = await (await fetch(url)).text();
  const match = css.match(/src:\s*url\((.+?)\)\s*format\(['"](?:opentype|truetype|woff)['"]\)/);
  if (!match) throw new Error("폰트 로드 실패");
  return (await fetch(match[1])).arrayBuffer();
}

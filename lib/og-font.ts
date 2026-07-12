// OG 이미지용 한글 폰트 — Google Fonts CSS API의 text= 서브셋으로 필요한 글자만 로드
// (Noto Sans KR 전체는 수 MB라 ImageResponse에 부적합)
export async function loadKoreanFont(text: string): Promise<ArrayBuffer> {
  const unique = Array.from(new Set(text)).join("");
  const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&text=${encodeURIComponent(unique)}`;
  const css = await (
    await fetch(url, {
      // woff2 대신 ttf/otf를 받기 위한 구형 UA (ImageResponse는 woff2 미지원)
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; rv:20.0) Gecko/20100101 Firefox/20.0" },
    })
  ).text();
  const match = css.match(/src:\s*url\((.+?)\)\s*format\(['"](?:opentype|truetype)['"]\)/);
  if (!match) throw new Error("폰트 로드 실패");
  return (await fetch(match[1])).arrayBuffer();
}

// ===MARKER=== 구분자 기반 블록 파서 — saju-mvp parseEightBlocks의 파라미터화 버전
// 상품마다 마커 구성이 다르므로 markers를 인자로 받는다.

export interface BlockMarker {
  key: string;   // 파싱 결과 키 (예: "한줄요약")
  token: string; // 구분자 토큰 (예: "BLOCK1_한줄요약")
}

export function parseBlocks(
  text: string,
  markers: BlockMarker[],
): Record<string, string> | { raw: string } {
  const out: Record<string, string> = {};
  for (let i = 0; i < markers.length; i++) {
    const tokenStr = "===" + markers[i].token + "===";
    const start = text.indexOf(tokenStr);
    if (start === -1) return { raw: text };
    const contentStart = start + tokenStr.length;
    const nextToken = i + 1 < markers.length ? "===" + markers[i + 1].token + "===" : null;
    const end = nextToken ? text.indexOf(nextToken, contentStart) : text.length;
    if (nextToken && end === -1) return { raw: text };
    out[markers[i].key] = text.slice(contentStart, end === -1 ? text.length : end).trim();
  }
  return out;
}

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ProductCode } from "@/lib/products";

// 일러스트 원화(scripts/gen-poster-art.ts로 생성해 사장님이 확정한 public/poster-art/{code}.png) 파일 접근 —
// 서버 전용(fs). lib/poster-art.ts는 클라이언트 컴포넌트에서도 import하므로 fs를 그쪽에 섞지 않는다.
// 원화가 아직 없는 상품이 있어도 페이지·포스터가 깨지지 않도록 "있으면 쓰고 없으면 폴백"을 여기서 판단한다.
const ART_DIR = join(process.cwd(), "public", "poster-art");

export function posterArtPath(code: ProductCode): string {
  return join(ART_DIR, `${code}.png`);
}

// 브라우저에서 쓰는 공개 URL — 존재할 때만 돌려준다(없으면 null → 무드 그라데이션 폴백)
export function posterArtUrl(code: ProductCode): string | null {
  try {
    return existsSync(posterArtPath(code)) ? `/poster-art/${code}.png` : null;
  } catch {
    return null;
  }
}

// next/og(Satori)는 로컬 파일을 못 읽어 data URL로 넣어야 한다 — 빌드 때 10장만 그리므로 크기 부담은 없다
export function posterArtDataUrl(code: ProductCode): string | null {
  try {
    const p = posterArtPath(code);
    if (!existsSync(p)) return null;
    return `data:image/png;base64,${readFileSync(p).toString("base64")}`;
  } catch {
    return null;
  }
}

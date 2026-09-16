import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ProductCode } from "@/lib/products";

// 일러스트 원화(scripts/gen-poster-art.ts로 생성해 사장님이 확정한 public/poster-art/{code}.jpg|png) 파일 접근 —
// 서버 전용(fs). lib/poster-art.ts는 클라이언트 컴포넌트에서도 import하므로 fs를 그쪽에 섞지 않는다.
// 원화가 아직 없는 상품이 있어도 페이지·포스터가 깨지지 않도록 "있으면 쓰고 없으면 폴백"을 여기서 판단한다.
// 2026-09-16: 웹용 확정본은 JPEG(장당 ~60~120KB)로 두고 무손실 PNG 원본은 저장소 밖(사장님 폴더)에 보관 —
// PNG는 회화풍 그라데이션에서 장당 1MB를 넘어 상세 페이지·OG 라우트에 과했다. jpg 우선, png는 하위 호환.
const ART_DIR = join(process.cwd(), "public", "poster-art");
const EXTS = ["jpg", "png"] as const;

function findArt(code: ProductCode): { path: string; ext: (typeof EXTS)[number] } | null {
  for (const ext of EXTS) {
    const path = join(ART_DIR, `${code}.${ext}`);
    if (existsSync(path)) return { path, ext };
  }
  return null;
}

export function posterArtPath(code: ProductCode): string {
  return findArt(code)?.path ?? join(ART_DIR, `${code}.jpg`);
}

// 브라우저에서 쓰는 공개 URL — 존재할 때만 돌려준다(없으면 null → 무드 그라데이션 폴백)
export function posterArtUrl(code: ProductCode): string | null {
  try {
    const hit = findArt(code);
    return hit ? `/poster-art/${code}.${hit.ext}` : null;
  } catch {
    return null;
  }
}

// next/og(Satori)는 로컬 파일을 못 읽어 data URL로 넣어야 한다 — 빌드 때 10장만 그리므로 크기 부담은 없다
export function posterArtDataUrl(code: ProductCode): string | null {
  try {
    const hit = findArt(code);
    if (!hit) return null;
    const mime = hit.ext === "jpg" ? "image/jpeg" : "image/png";
    return `data:${mime};base64,${readFileSync(hit.path).toString("base64")}`;
  } catch {
    return null;
  }
}

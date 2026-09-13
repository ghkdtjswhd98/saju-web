import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite(로컬 DB 폴백)는 wasm 에셋을 자체 경로로 로드하므로 번들에서 제외해야 한다
  // pdfkit은 내장 폰트 .afm을 파일 경로로 읽어서 번들링하면 깨진다
  serverExternalPackages: ["@electric-sql/pglite", "pdfkit"],
  // 상품 상세(ISR)는 런타임에 fs.existsSync로 원화(public/poster-art/{code}.png) 유무를 판단한다 —
  // 동적 경로라 자동 트레이싱에 안 잡히므로 서버 함수 번들에 직접 포함시킨다
  outputFileTracingIncludes: {
    "/products/[code]": ["./public/poster-art/*.png"],
  },
};

export default nextConfig;

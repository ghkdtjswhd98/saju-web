import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite(로컬 DB 폴백)는 wasm 에셋을 자체 경로로 로드하므로 번들에서 제외해야 한다
  // pdfkit은 내장 폰트 .afm을 파일 경로로 읽어서 번들링하면 깨진다
  serverExternalPackages: ["@electric-sql/pglite", "pdfkit"],
};

export default nextConfig;

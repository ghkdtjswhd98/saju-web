import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite(로컬 DB 폴백)는 wasm 에셋을 자체 경로로 로드하므로 번들에서 제외해야 한다
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;

import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
  // app/**의 서버 컴포넌트도 "함수"라 렌더러 없이 호출해 분기를 검증할 수 있다
  // (app/chemi/page.test.tsx — 시즌 문구가 화면까지 연결됐는지)
  test: {
    include: ["lib/**/*.test.ts", "app/**/*.test.tsx"],
  },
});

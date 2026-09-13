/**
 * 상품 포스터 일러스트 원화 생성기 — docs/superpowers/specs/2026-09-13-product-detail-v2.md §1
 *
 * 사용법 (키 하나만 있으면 됨 — .env.local 또는 셸 환경변수):
 *   GEMINI_API_KEY=...  npx tsx scripts/gen-poster-art.ts               # 10종 × 3안 → public/poster-art/candidates/{code}-{n}.png
 *   OPENAI_API_KEY=...  npx tsx scripts/gen-poster-art.ts --n 2 --only reunion,crush
 *   npx tsx scripts/gen-poster-art.ts --pick reunion=2 crush=1           # 후보안을 public/poster-art/{code}.png 로 확정 (API 호출 없음)
 *
 * - 우선순위: GEMINI_API_KEY(gemini-2.5-flash-image) → OPENAI_API_KEY(gpt-image-1). 둘 다 없으면 안내 후 종료.
 * - 원화는 세로(4:5, 약 1024×1280)·텍스트 없음. 라우트(app/brand/poster*, app/products/[code])가 크롭·글자 합성을 맡는다.
 * - candidates/ 는 .gitignore, 확정본 {code}.png 는 커밋한다(정적 서빙).
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PRODUCTS, type ProductCode } from "../lib/products";
import { loadEnvLocal } from "./content-gen-lib";

const ART_DIR = join(process.cwd(), "public", "poster-art");
const CAND_DIR = join(ART_DIR, "candidates");

// 스타일 통일 접두어 — 스펙 §1 원문. 상품이 바뀌어도 이 문장은 고정해 10장이 한 세트로 보이게 한다.
const STYLE_PREFIX =
  "부드러운 웹툰풍 일러스트, 한국 20~30대 인물, 섬세한 선, 파스텔+딥네이비 대비, 밤하늘·별 모티프가 은은하게, " +
  "텍스트 없음, 로고 없음, 워터마크 없음, 얼굴 자연스럽게, 상반신 또는 실루엣, 여백은 아래쪽(제목 자리). " +
  "세로 4:5 구도, 하단 40%는 어둡고 단순하게 비워둘 것.";

// 상품별 장면 — 스펙 §1 원문(타이트사주 구도 직접 복제 금지)
const SCENES: Record<ProductCode, string> = {
  deep: "밤하늘 아래 한복 두루마리를 펼쳐 보는 청년, 금색 글자 빛",
  bundle: "세 장의 카드가 부채처럼 펼쳐진 손, 보라 안개",
  lifetime: "별자리 지도를 올려다보는 사람 뒷모습, 인생 길이 이어진 밤길",
  year: "붉은 말(병오) 실루엣이 달을 가로지르는 겨울 밤하늘, 눈송이",
  career: "금빛 동전이 흩날리는 서재, 미소 짓는 인물 반측면, 초록 커튼",
  reunion: "새벽 창가에서 폰 불빛을 바라보는 인물, 딥네이비, 창밖 초승달",
  crush: "카페 창가 두 사람, 한 명은 폰을 보고 한 명은 그 사람을 보고, 핑크오렌지 노을",
  love: "손끝이 닿을 듯한 두 손, 사이에 별빛 실, 은하수",
  marriage: "면사포 너머 미소, 창문 역광, 흰 꽃",
  dohwa: "붉은 꽃잎 흩날리는 밤, 자신감 있는 인물 실루엣, 버건디",
};

function prompt(code: ProductCode): string {
  return `${STYLE_PREFIX}\n\n장면: ${SCENES[code]}`;
}

// ── 이미지 생성 백엔드 ──────────────────────────────────────────────

async function genGemini(key: string, text: string): Promise<Buffer> {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "4:5" } },
    }),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { inlineData?: { data?: string } }[] } }[];
  };
  const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part?.inlineData?.data) throw new Error("Gemini 응답에 이미지가 없음");
  return Buffer.from(part.inlineData.data, "base64");
}

async function genOpenAI(key: string, text: string): Promise<Buffer> {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    // gpt-image-1은 4:5가 없어 2:3(1024×1536)으로 받는다 — 라우트에서 object-cover로 크롭하니 문제 없음
    body: JSON.stringify({ model: "gpt-image-1", prompt: text, n: 1, size: "1024x1536", quality: "high" }),
  });
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { data?: { b64_json?: string }[] };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI 응답에 이미지가 없음");
  return Buffer.from(b64, "base64");
}

// ── CLI ─────────────────────────────────────────────────────────────

function parseArgs(argv: string[]) {
  let n = 3;
  let only: ProductCode[] | null = null;
  const picks: { code: ProductCode; n: number }[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--n") n = Number(argv[++i]);
    else if (a === "--only") {
      const v = argv[++i];
      if (!v || v.startsWith("--")) throw new Error("--only 뒤에 상품 코드를 쉼표로 적어주세요 (예: --only reunion,crush)");
      only = v.split(",").map(asCode);
    }
    else if (a === "--pick") {
      // --pick 뒤에 code=n 쌍을 여러 개 받는다
      while (argv[i + 1] && !argv[i + 1].startsWith("--")) {
        const [c, k] = argv[++i].split("=");
        picks.push({ code: asCode(c), n: Number(k) });
      }
    }
  }
  if (!Number.isInteger(n) || n < 1) throw new Error("--n 은 1 이상 정수");
  return { n, only, picks };
}

function asCode(s: string): ProductCode {
  if (!(s in PRODUCTS)) throw new Error(`알 수 없는 상품 코드: ${s}`);
  return s as ProductCode;
}

function pick(picks: { code: ProductCode; n: number }[]) {
  for (const { code, n } of picks) {
    const src = join(CAND_DIR, `${code}-${n}.png`);
    if (!existsSync(src)) throw new Error(`후보안이 없음: ${src}`);
    copyFileSync(src, join(ART_DIR, `${code}.png`));
    console.log(`확정: ${code} ← candidates/${code}-${n}.png`);
  }
  console.log("완료 — 확정본을 커밋하고 npx next build 로 포스터를 다시 그리세요.");
}

async function main() {
  loadEnvLocal(); // tsx는 .env.local을 자동으로 읽지 않는다 — 헤더 안내대로 키를 파일에 둬도 되게
  const { n, only, picks } = parseArgs(process.argv.slice(2));
  if (picks.length) return pick(picks);

  const gemini = process.env.GEMINI_API_KEY;
  const openai = process.env.OPENAI_API_KEY;
  const gen = gemini
    ? (t: string) => genGemini(gemini, t)
    : openai
      ? (t: string) => genOpenAI(openai, t)
      : null;
  if (!gen) {
    console.log(
      "이미지 생성 키가 없어요. 둘 중 하나를 .env.local 에 넣고 다시 실행하세요:\n" +
        "  GEMINI_API_KEY  — https://aistudio.google.com (gemini-2.5-flash-image)\n" +
        "  OPENAI_API_KEY  — https://platform.openai.com (gpt-image-1)",
    );
    return;
  }
  console.log(`백엔드: ${gemini ? "Gemini gemini-2.5-flash-image" : "OpenAI gpt-image-1"} · 상품당 ${n}안`);

  mkdirSync(CAND_DIR, { recursive: true });
  const codes = only ?? (Object.keys(PRODUCTS) as ProductCode[]);
  for (const code of codes) {
    for (let k = 1; k <= n; k++) {
      const out = join(CAND_DIR, `${code}-${k}.png`);
      try {
        writeFileSync(out, await gen(prompt(code)));
        console.log(`저장: candidates/${code}-${k}.png`);
      } catch (e) {
        // 한 장 실패로 전체를 멈추지 않는다 — 나머지를 만든 뒤 실패분만 다시 돌리면 된다
        console.error(`실패: ${code}-${k} — ${(e as Error).message}`);
      }
    }
  }
  console.log("완료 — 후보안을 보고 `--pick code=n` 으로 확정하세요.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

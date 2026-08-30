/**
 * 띠별 운세 숏폼 대본 생성기 — "딸깍" 파이프라인의 1단계.
 *
 * 강의 분석(2026-08-30)에서 추출한 후킹 공식 + social 스킬의 숏폼 규격을 결합:
 *   [0-3초] 띠 지목 훅 (비주얼+멘트+화면텍스트 동시) → [3-10초] 올해 기운의 긴장
 *   → [10-25초] 실제 지지 관계 근거 풀이 → [25-30초] 댓글 키워드 CTA
 *
 * 실행:
 *   npx tsx --env-file=.env.local scripts/generate-shorts.ts                # 12띠 전부, 기본 상품
 *   npx tsx --env-file=.env.local scripts/generate-shorts.ts --tti rat,horse --product reunion
 *   옵션: --product (기본 year) --tone dosa|eonni (기본 dosa) --model <모델ID>
 *
 * 출력: marketing/shorts/YYYY-MM-DD-<product>/<띠>.md (대본·자막·캡션·CTA 전부 포함)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PRODUCTS, getProduct } from "../lib/products";
import {
  CONTENT_GUARDRAILS, THIS_YEAR, TTIS, YEAR_LABEL,
  arg, generate, getModel, loadEnvLocal, ttiYearRelation,
} from "./content-gen-lib";

// 폴더명용 상품 한글 약칭 — 사장님이 탐색기에서 바로 알아보게 (2026-08-30 요청)
const PRODUCT_KO: Record<string, string> = {
  year: "올해운세", reunion: "재회", marriage: "결혼운", dohwa: "도화살",
  crush: "짝사랑썸", love: "궁합", career: "직업재물", lifetime: "평생사주", deep: "심층사주",
};

// 상품별 댓글 CTA 키워드 — DM 자동화가 붙으면 이 키워드가 트리거가 된다
const CTA_KEYWORD: Record<string, string> = {
  year: "남은운", reunion: "재회", marriage: "결혼운", dohwa: "도화",
  crush: "속마음", love: "궁합", career: "재물", lifetime: "내팔자", deep: "심층",
};

const TONES: Record<string, string> = {
  dosa: `말투: 젊은 도사 컨셉. 반말, 짧고 단호한 문장, 혼내듯 직설적이지만 결국 챙겨주는 톤.
예: "개띠. 스크롤 멈춰라. 올해 너한테 들어온 기운, 이거 모르고 지나가면 아깝다."`,
  eonni: `말투: 사주 잘 보는 친한 언니 컨셉. 반말, 수다 떨듯 자연스럽게, 핵심은 콕 집는 톤.
예: "얘 쥐띠들아, 올해 왜 이렇게 마음이 붕 뜨는지 알려줄게."`,
};

async function one(tti: (typeof TTIS)[number], productCode: string, tone: string, outDir: string) {
  const product = getProduct(productCode)!;
  const relation = ttiYearRelation(tti);
  const keyword = CTA_KEYWORD[productCode] ?? "운세";

  const system = `당신은 사주 콘텐츠 전문 숏폼 작가입니다. 오롭미(만세력 기반 AI 사주 리포트 서비스)의 릴스/쇼츠/틱톡 대본을 씁니다.

${CONTENT_GUARDRAILS}

# 숏폼 규격 (social 스킬 기준, 엄격)
- 총 20~30초 분량. 첫 3초 안에 비주얼 훅 + 멘트 훅 + 화면 텍스트 훅이 동시에 터져야 함.
- 구조: [0-3초 띠 지목 훅] → [3-10초 올해 기운의 긴장] → [10-25초 근거 있는 풀이] → [25-30초 CTA].
- 자막: 한 번에 최대 2줄, 줄당 3~5어절. 말과 정확히 동기화.
- CTA는 반드시 "댓글에 ${keyword} 남겨" + "프로필 링크" 두 가지를 자연스럽게.
- 풀이의 근거는 반드시 제공된 실제 지지 관계에서만. 관계가 "없음"이면 그것대로 평탄·안정 서사로.

# 출력 형식 (마크다운, 정확히 이 구조)
## 훅 (0-3초)
- 비주얼: [첫 프레임 화면 지시 1줄]
- 멘트: [첫 문장]
- 화면텍스트: [큰 자막 1줄, 8자 이내]

## 대본 (타임코드)
[0-3s] ...
[3-10s] ...
[10-25s] ...
[25-30s] ...

## 자막 (줄단위, CapCut 복붙용)
[한 줄에 3~5어절씩, 대본 전체를 순서대로]

## 캡션
[2~3문장 + 해시태그 5개]

## 댓글 고정용
[업로드 직후 작성자가 달아둘 고정 댓글 1개 — CTA 반복]`;

  const user = `띠: ${tti.name} (${tti.branch})
올해: ${THIS_YEAR}년 ${YEAR_LABEL}
이 띠와 올해 지지의 실제 관계 (만세력 계산): ${relation}
연결 상품: ${product.name} — ${product.tagline} (카드 제목: "${product.cardTitle}")
댓글 CTA 키워드: ${keyword}
${TONES[tone]}

위 정보로 ${tti.name} 대상 숏폼 대본 1개를 작성하세요. 상품 이름을 대본에서 직접 팔지 말고(광고 티 금지), "더 깊은 건 프로필에서"의 결로만 연결하세요.`;

  const text = await generate(system, user, 3000);
  const header = `# ${tti.emoji} ${tti.name} — ${THIS_YEAR} ${YEAR_LABEL} (상품: ${productCode})
> 지지 관계 근거: ${relation}
> CTA 키워드: ${keyword} · 생성 모델: ${getModel()} · ${new Date().toISOString().slice(0, 10)}
> 재업로드 체크: [ ] 인스타 릴스 [ ] 틱톡 [ ] 유튜브 쇼츠 [ ] 네이버 클립

`;
  writeFileSync(join(outDir, `${tti.name}.md`), header + text, "utf8");
  console.log(`✅ ${tti.name} (${(text.length / 1000).toFixed(1)}k자)`);
}

async function main() {
  loadEnvLocal();
  const productCode = arg("product") ?? "year";
  if (!getProduct(productCode)) {
    console.error(`알 수 없는 상품: ${productCode} (가능: ${Object.keys(PRODUCTS).join(", ")})`);
    process.exit(1);
  }
  const tone = arg("tone") ?? "dosa";
  if (!TONES[tone]) {
    console.error(`알 수 없는 말투: ${tone} (가능: ${Object.keys(TONES).join(", ")})`);
    process.exit(1);
  }
  const ttiFilter = arg("tti")?.split(",");
  const targets = ttiFilter ? TTIS.filter((t) => ttiFilter.includes(t.key)) : TTIS;

  const outDir = join(
    process.cwd(), "marketing", "shorts",
    `${new Date().toISOString().slice(0, 10)}-${PRODUCT_KO[productCode] ?? productCode}`,
  );
  mkdirSync(outDir, { recursive: true });
  console.log(`출력: ${outDir} / 대상 ${targets.length}띠 / 상품 ${productCode} / 말투 ${tone}`);

  // 순차 생성 (레이트리밋 배려) — 12띠 약 3~5분
  for (const t of targets) await one(t, productCode, tone, outDir);
  console.log("완료. 파일을 열어 CapCut에 자막 섹션을 붙여넣으면 됩니다.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

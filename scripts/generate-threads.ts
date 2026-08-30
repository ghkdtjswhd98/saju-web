/**
 * 쓰레드(Threads) 운세성 글 생성기 — 무자본 트래픽 채널의 탄약 공장.
 *
 * 강의 분석(2026-08-30): 터지는 쓰레드 글 = 운세성 단문("12월은 반전의 달이다" → 조회 1만).
 * 기존 marketing/threads-30.md·pattern-library.md의 검증 패턴을 계승해 매일 쓸 분량을 찍는다.
 *
 * 실행:
 *   npx tsx --env-file=.env.local scripts/generate-threads.ts               # 10개
 *   npx tsx --env-file=.env.local scripts/generate-threads.ts --count 20 --theme reunion
 * 옵션: --count (기본 10) --theme year|reunion|marriage|dohwa|crush|mix (기본 mix) --model <모델ID>
 *
 * 출력: marketing/threads/YYYY-MM-DD.md (글 하나씩 복붙 가능한 블록)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CONTENT_GUARDRAILS, THIS_YEAR, YEAR_LABEL, arg, generate, getModel, loadEnvLocal } from "./content-gen-lib";

const THEMES: Record<string, string> = {
  mix: "연애·재회·결혼·직업·돈·자존감을 골고루 섞어서",
  year: `${THIS_YEAR} ${YEAR_LABEL} 하반기·월별 흐름 중심으로`,
  reunion: "이별·재회·미련·전 연인 생각 중심으로 (매달림 조장 금지, 자기 회복 축 유지)",
  marriage: "결혼·인연·배우자 타이밍 중심으로",
  dohwa: "매력·도화·첫인상·끌림 중심으로",
  crush: "짝사랑·썸·고백 타이밍 중심으로",
};

async function main() {
  loadEnvLocal();
  const count = Math.min(Number(arg("count") ?? 10), 30);
  const theme = arg("theme") ?? "mix";
  if (!THEMES[theme]) {
    console.error(`알 수 없는 테마: ${theme} (가능: ${Object.keys(THEMES).join(", ")})`);
    process.exit(1);
  }

  // 기존 검증 패턴을 퓨샷으로 주입 (파일이 있으면)
  let fewshot = "";
  const legacy = join(process.cwd(), "marketing", "threads-30.md");
  if (existsSync(legacy)) {
    fewshot = `\n# 기존에 만든 우리 글 스타일 예시 (톤 참고용, 복제 금지)\n${readFileSync(legacy, "utf8").slice(0, 3000)}`;
  }

  const system = `당신은 쓰레드(Threads)에서 터지는 운세성 단문을 쓰는 작가입니다. 오롭미(만세력 기반 AI 사주 리포트) 계정용입니다.

${CONTENT_GUARDRAILS}

# 쓰레드 글 규칙
- 글 1개 = 1~4문장, 300자 이내. 첫 문장이 훅 (스크롤 멈추는 단정적 명제).
- 패턴 (골고루 섞을 것):
  ① 시기 명제형: "9월은 ○○의 달이다. ~한 사람부터 흐름이 바뀐다."
  ② 특정 대상 지목형: "요즘 밤에 자꾸 옛날 생각나는 사람, 그거 미련이 아니라 ~다."
  ③ 반전 통찰형: "사주에서 제일 위험한 건 나쁜 운이 아니라 좋은 운을 흘려보내는 거다."
  ④ 공감 저격형: "연락할까 말까 백 번 고민하는 것 자체가 이미 답이다."
  ⑤ 미니 지식형: "말의 해에 태어난 사람들이 유독 ~한 이유."
- 대부분의 글은 CTA 없이 리치를 벌고, ${Math.max(2, Math.floor(count / 5))}개 정도만 마지막 줄에 "프로필의 무료 사주에서 확인해봐" 정도의 약한 CTA.
- 이모지는 글당 0~1개. 해시태그 금지 (쓰레드는 해시태그 문화 아님).
- 서로 같은 구조·같은 소재가 반복되면 실패. ${count}개가 전부 달라야 한다.
${fewshot}

# 출력 형식
각 글을 이 형식으로:
---
### N. [패턴 유형]
[글 본문]
`;

  const user = `${THIS_YEAR}년 ${new Date().toISOString().slice(0, 10)} 기준, ${THEMES[theme]} 쓰레드 글 ${count}개를 작성하세요.`;

  console.log(`생성 중... (${count}개, 테마 ${theme}, 모델 ${getModel()})`);
  const text = await generate(system, user, 6000);

  const outDir = join(process.cwd(), "marketing", "threads");
  mkdirSync(outDir, { recursive: true });
  const file = join(outDir, `${new Date().toISOString().slice(0, 10)}-${theme}.md`);
  const header = `# 쓰레드 발행 대기 — ${new Date().toISOString().slice(0, 10)} (테마: ${theme})
> 사용법: 하루 2~4개씩 복붙 발행. 발행한 글은 체크 표시. 반응 좋은 패턴은 pattern-library.md에 기록.

`;
  writeFileSync(file, header + text, "utf8");
  console.log(`✅ 저장: ${file} (${(text.length / 1000).toFixed(1)}k자)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

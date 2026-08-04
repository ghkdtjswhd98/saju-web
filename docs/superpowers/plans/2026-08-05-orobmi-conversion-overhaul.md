# 오롭미 전환 최적화 + 프리미엄 상품 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 당근·웹 최상위 판매자 벤치마킹 결과를 반영해 가격 사다리 상단(프리미엄 상품)을 신설하고, 전환을 막는 카피·신뢰 장치를 전면 교체한다.

**Architecture:** 기존 상품 카탈로그(`lib/products.ts`)에 프리미엄 코드 1종을 추가하고, 그에 대응하는 프롬프트 포맷(`lib/prompts/formats.ts`)을 신설한다. 카피 변경은 렌더 파일(`app/page.tsx`, `app/products/page.tsx`, `components/*`)에 국한되며 로직 변경이 없다. 계산 로직(대운·오행)은 이미 검증돼 있으므로 재사용한다.

**Tech Stack:** Next.js 16 App Router, TypeScript, Drizzle/Postgres, Anthropic SDK(Opus 4.8/Haiku 4.5), vitest, pdfkit.

---

## 리서치 근거 (2026-08-05 실측, 3개 에이전트 병렬 조사)

| 발견 | 근거 | 우리 대응 |
|---|---|---|
| 당근 상위 업체 가격대는 2만~4.5만원 | 명리학도 사주박사 35,000원(후기 2,741), 사주대가 29,900원(후기 3,018), 명리심리연구소 20,000원(후기 2,568) | 6,900원은 사다리 **진입가**로 유지, 상단에 프리미엄 신설 |
| "분량 = 정성 = 가치" 등치가 업계 표준 | "170장 종합사주", "100페이지 이상", 포스텔러 "200쪽 이상", 헬로우봇 "2만자 이상" | 프리미엄은 12섹션·2만자·30페이지+ |
| 납기는 "하루~이틀"이 표준 | 명리학도 "하루~이틀 소요", 사주대가 "주말 응대 지연" | **1~2분 즉시 발급**을 최전면 차별점으로 |
| 리포트 전문 공개는 8개 경쟁사 중 0건 | 크몽 3건·사주나침반·라이프공육사오·프로소울사주·포스텔러·헬로우봇 전수 확인 | `/sample`이 진짜 유일 차별점 — 카피로 명시 |
| 100% 환불 보장이 진입 표준 | 명리심리연구소 "마음에 들지 않으면 100% 환불" | 생성 전 100% 환불을 명문화 |
| 부정 후기 1순위는 "AI 같다" | 사주대가 실제 후기 "제미나이가 더 잘봐요" | 계산 근거 노출을 강화해 방어 |
| 카드뉴스 인게이지(0.55%)가 릴스(0.50%)보다 높고 저장률 22%↑ | 2026 인스타 알고리즘 분석 | 카드뉴스=전환, 릴스=신규유입 역할 분리 |
| 스레드 댓글 1개 = 좋아요 8개 가중치, 링크는 답글에 | threadsauto.kr 2026 알고리즘 분석 | 본문 링크 금지, 답글 배치 |

---

## File Structure

| 파일 | 책임 | 변경 |
|---|---|---|
| `lib/products.ts` | 상품 카탈로그·가격·분량 메타 | 수정 — `deep` 상품 추가 |
| `lib/prompts/formats.ts` | 상품별 출력 형식·마커 | 수정 — `DEEP_FORMAT` 추가 |
| `lib/pricing.ts` | 단계 가격 계산 | 변경 없음 (자동 반영) |
| `app/api/reports/[token]/stream/route.ts` | 생성 라우팅 | 수정 — deep에 대운 주입 |
| `app/page.tsx` | 랜딩 | 수정 — 카피 5곳 |
| `app/products/page.tsx` | 상품 목록 | 수정 — 카피 3곳, 환불 각주 이동 |
| `components/ReviewList.tsx` | 후기 노출 | 수정 — 수치 승격 |
| `app/refund/page.tsx` | 환불 정책 | 수정 — 생성 전 100% 환불 명문화 |
| `marketing/danggeun.md` | 당근 운영 매뉴얼 | 수정 — 가격 사다리·스크립트 갱신 |
| `marketing/sns-playbook.md` | 인스타·스레드 매뉴얼 | 신규 |

---

### Task 1: 프리미엄 상품 `deep` 카탈로그 등록

**Files:**
- Modify: `lib/products.ts`
- Test: `lib/products.test.ts` (신규)

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/products.test.ts`:
```typescript
import { describe, expect, it } from "vitest";
import { PRODUCTS, getProduct } from "./products";

describe("상품 카탈로그", () => {
  it("모든 상품에 분량 메타가 있다", () => {
    for (const p of Object.values(PRODUCTS)) {
      expect(p.pdfPages).toBeGreaterThan(0);
      expect(p.charCount).toMatch(/자$/);
    }
  });

  it("deep은 가격 사다리 상단이다 (lifetime보다 비싸고 섹션이 많다)", () => {
    const deep = getProduct("deep")!;
    const lifetime = getProduct("lifetime")!;
    expect(deep.openPrice).toBeGreaterThan(lifetime.openPrice);
    expect(deep.sections.length).toBeGreaterThan(lifetime.sections.length);
    expect(deep.pdfPages).toBeGreaterThan(lifetime.pdfPages);
  });

  it("번들은 포함 상품이 전부 실재한다", () => {
    for (const code of PRODUCTS.bundle.bundleCodes ?? []) {
      expect(getProduct(code)).not.toBeNull();
    }
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run lib/products.test.ts`
Expected: FAIL — `getProduct("deep")` 가 null이라 `deep.openPrice` 접근에서 터진다.

- [ ] **Step 3: 최소 구현**

`lib/products.ts`의 `ProductCode`에 `"deep"` 추가:
```typescript
export type ProductCode = "lifetime" | "love" | "year" | "career" | "bundle" | "deep";
```

`PRODUCTS` 객체 맨 위(bundle 앞)에 추가:
```typescript
  deep: {
    code: "deep",
    name: "정통 심층사주 (프리미엄)",
    tagline: "10년 단위 대운까지 한 장씩, 평생 한 번 제대로 보는 사주",
    openPrice: 19900,
    listPrice: 29900,
    personCount: 1,
    sections: [
      "인생 총평", "타고난 기질", "숨은 재능", "재물운", "직업운", "연애·결혼운",
      "건강운", "인간관계", "대운 10년별 흐름", "올해와 내년", "인생의 전환점", "실천 조언",
    ],
    pdfPages: 32,
    charCount: "20,000자",
  },
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run lib/products.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add lib/products.ts lib/products.test.ts && git commit -m "feat: 프리미엄 상품 deep 카탈로그 등록"
```

---

### Task 2: `deep` 출력 형식 프롬프트

**Files:**
- Modify: `lib/prompts/formats.ts`
- Test: `lib/prompts/formats.test.ts` (신규)

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/prompts/formats.test.ts`:
```typescript
import { describe, expect, it } from "vitest";
import { FORMATS } from "./formats";
import { PRODUCTS } from "../products";

describe("출력 형식", () => {
  it("모든 상품 코드에 형식이 있다", () => {
    for (const code of Object.keys(PRODUCTS)) {
      if (code === "bundle") continue; // 번들은 하위 상품으로 발급됨
      expect(FORMATS[code], `${code} 형식 누락`).toBeDefined();
    }
  });

  it("deep 형식의 마커 수가 상품 섹션 수와 일치한다", () => {
    expect(FORMATS.deep.markers).toHaveLength(PRODUCTS.deep.sections.length);
  });

  it("deep 형식은 대운 시간표 활용을 지시한다", () => {
    expect(FORMATS.deep.system).toContain("대운_시간표");
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run lib/prompts/formats.test.ts`
Expected: FAIL — `FORMATS.deep` 이 undefined.

- [ ] **Step 3: 최소 구현**

`lib/prompts/formats.ts`의 `CAREER_FORMAT` 정의 뒤에 추가:
```typescript
// ── 정통 심층사주 (프리미엄) ──────────────────────────────────
// 당근 상위 판매자(2~4만원대)와 같은 링에 올리는 상품. 분량과 시간축(대운)이 가치의 축.
export const DEEP_FORMAT: ReportFormat = {
  markers: [
    { key: "인생 총평", token: "SECTION_인생총평" },
    { key: "타고난 기질", token: "SECTION_타고난기질" },
    { key: "숨은 재능", token: "SECTION_숨은재능" },
    { key: "재물운", token: "SECTION_재물운" },
    { key: "직업운", token: "SECTION_직업운" },
    { key: "연애·결혼운", token: "SECTION_연애결혼운" },
    { key: "건강운", token: "SECTION_건강운" },
    { key: "인간관계", token: "SECTION_인간관계" },
    { key: "대운 10년별 흐름", token: "SECTION_대운흐름" },
    { key: "올해와 내년", token: "SECTION_올해와내년" },
    { key: "인생의 전환점", token: "SECTION_인생전환점" },
    { key: "실천 조언", token: "SECTION_실천조언" },
  ],
  system: `${PAID_COMMON}

# 정통 심층사주 (프리미엄) — 최상위 상품

이 리포트는 오롭미의 최상위 상품입니다. 같은 고객이 평생사주 리포트도 구매했을 수 있으니, 여기서는 **깊이와 시간축**으로 차별화하세요. 총 20,000자 이상.

# 출력 형식 (엄격) — 12섹션

아래 12개 구분자를 정확히 그대로, 이 순서로 사용하세요. 구분자는 반드시 줄 시작에 위치합니다.

===SECTION_인생총평===
[900자 이상. 이 사람의 인생 설계도를 한 장면처럼. 첫 문장은 후킹 카피.]

===SECTION_타고난기질===
[1800자 이상. 겉과 속의 간극, 대인관계에서의 모습과 혼자일 때의 모습, 구체적 일상 장면 5개 이상.]

===SECTION_숨은재능===
[1400자 이상. 본인은 당연하게 여겨 모르는 재능 3가지. 각각 "언제 발현되는지" 구체 장면과 함께. 다른 섹션과 겹치지 않게 재능 자체에만 집중.]

===SECTION_재물운===
[1600자 이상. 돈이 들어오는 방식, 새는 패턴과 그 순간의 장면, 재물 그릇의 크기, 돈과 감정의 관계, 자산을 지키는 구조.]

===SECTION_직업운===
[1600자 이상. 빛나는 일의 결, 구체 직군 3개 이상과 그중 최적 하나를 이유와 함께 지목, 소모되는 환경과 그 신호.]

===SECTION_연애결혼운===
[1800자 이상. 연애 스타일, 끌리는 상대의 결, 관계 단계별 패턴, 반복되는 패턴의 뿌리, 결혼을 고려한다면 의식할 지점. <대운_시간표>가 주어지면 관계운이 짙어지는 시기를 나이로 언급.]

===SECTION_건강운===
[900자 이상. 오행 균형에서 읽히는 컨디션 관리 포인트, 방전 패턴과 회복 방식. 의료 조언 금지.]

===SECTION_인간관계===
[1400자 이상. 사람을 대하는 기본값, 잘 맞는 결과 부딪히는 결, 관계에서 반복되는 역할(중재자·리더·관찰자 등), 거리 조절법.]

===SECTION_대운흐름===
[3000자 이상. **이 리포트의 핵심 섹션입니다.** <대운_시간표>의 각 10년 구간을 하나씩 소제목처럼 다루세요.
- 각 구간마다 "○세~○세: [그 시기의 이름]" 형식으로 시작하고, 그 10년의 주제·열리는 문·조심할 문을 각각 서술.
- 지나온 구간은 짧게, 현재와 앞으로 올 2개 구간은 길고 깊게.
- 간지 이름(갑자 등)은 노출 금지 — 기운을 일상 언어로 명명.
- 확정 예언 금지, 경향의 언어로.]

===SECTION_올해와내년===
[1400자 이상. 올해(세운)의 흐름을 상세히, 그리고 내년에 무엇이 달라지는지. 두 해를 대비해 서술.]

===SECTION_인생전환점===
[1200자 이상. <대운_시간표> 기준으로 판이 크게 바뀌는 시점 2개를 나이로 짚고, 각 전환점에서 무엇을 준비해야 하는지.]

===SECTION_실천조언===
[정확히 7줄. 각 줄 30자 내외의 구체 행동. 줄바꿈으로 구분, 불릿/번호 금지. 의료·법률·투자 조언 금지.]

출력은 반드시 ===SECTION_인생총평===으로 시작해 실천조언 7번째 줄로 끝납니다.`,
};
```

같은 파일 하단 `FORMATS` 객체에 등록:
```typescript
export const FORMATS: Record<string, ReportFormat> = {
  free: FREE_FORMAT,
  free_love: FREE_LOVE_FORMAT,
  lifetime: LIFETIME_FORMAT,
  love: LOVE_FORMAT,
  year: YEAR_FORMAT,
  career: CAREER_FORMAT,
  deep: DEEP_FORMAT,
};
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run lib/prompts/formats.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add lib/prompts/formats.ts lib/prompts/formats.test.ts && git commit -m "feat: 정통 심층사주 12섹션 프롬프트"
```

---

### Task 3: `deep` 생성 시 대운 데이터 주입

**Files:**
- Modify: `app/api/reports/[token]/stream/route.ts:96-102`

- [ ] **Step 1: 현재 분기 확인**

Run: `grep -n "withDaewoon" app/api/reports/\[token\]/stream/route.ts`
Expected: `withDaewoon: productCode === "lifetime" || productCode === "career",`

- [ ] **Step 2: deep 추가**

해당 줄을 아래로 교체:
```typescript
      withDaewoon:
        productCode === "lifetime" || productCode === "career" || productCode === "deep",
```

- [ ] **Step 3: maxTokens 상향**

같은 파일의 maxTokens 줄을 아래로 교체 (deep은 20,000자 = 약 27K 토큰 필요):
```typescript
  const maxTokens = isFree ? 3000 : productCode === "deep" ? 40000 : 24000;
```

- [ ] **Step 4: 빌드 확인**

Run: `npm run build`
Expected: `✓ Compiled successfully`

- [ ] **Step 5: 커밋**

```bash
git add "app/api/reports/[token]/stream/route.ts" && git commit -m "feat: deep 리포트에 대운 주입 + 토큰 상향"
```

---

### Task 4: `deep` 실생성 품질 검증

**Files:**
- 없음 (검증 전용)

- [ ] **Step 1: dev 서버 확인 후 시드**

```bash
curl -s -X POST http://localhost:3000/api/admin -H "content-type: application/json" -H "x-admin-key: $ADMIN_KEY" -d '{"action":"issue","productCode":"deep","kind":"tester","persons":[{"name":"심층검증","gender":"여","year":1991,"month":11,"day":9,"hourValue":"16","isLunar":false,"isLeap":false}]}'
```
Expected: `{"tokens":["..."],"orderId":null}`

- [ ] **Step 2: 생성**

```bash
curl -sN "http://localhost:3000/api/reports/<TOKEN>/stream" -o /dev/null --max-time 400
```
Expected: 무응답 후 종료 (SSE 소비 완료)

- [ ] **Step 3: 품질 확인**

```bash
curl -s "http://localhost:3000/api/admin?token=<TOKEN>" -H "x-admin-key: $ADMIN_KEY"
```
Expected: `{"status":"done","length":<20000 이상>}`

length가 18,000 미만이면 `DEEP_FORMAT`의 각 섹션 최소 자수를 20% 상향하고 Task 4를 다시 수행.

- [ ] **Step 4: PDF 페이지 수 확인**

```bash
curl -s "http://localhost:3000/report/<TOKEN>/pdf" -o /tmp/deep.pdf && node -e "const s=require('fs').readFileSync('/tmp/deep.pdf','latin1');console.log('페이지:',(s.match(/\/Type\s*\/Page[^s]/g)||[]).length)"
```
Expected: 페이지 25 이상. 미달이면 `lib/products.ts`의 `pdfPages`를 실측값으로 정정한다 (과장 금지).

- [ ] **Step 5: 커밋 (실측값 정정이 있었을 때만)**

```bash
git add lib/products.ts && git commit -m "fix: deep 실측 분량 반영"
```

---

### Task 5: 랜딩·상품 카피 교체

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/products/page.tsx`

- [ ] **Step 1: 랜딩 히어로 — 문제 제기형 훅 추가**

`app/page.tsx`에서 아래 줄을 찾는다:
```tsx
        <p className="mt-3 text-sm font-medium text-accent-strong">회원가입 없는 무료 AI 사주</p>
```
아래로 교체:
```tsx
        <p className="mt-3 text-sm font-medium text-accent-strong">
          회원가입 없이 30초 · 만세력 기반
        </p>
```

- [ ] **Step 2: 상품 그리드 카피 교체**

`app/page.tsx`에서:
```tsx
        <h2 className="text-center text-lg font-bold">더 깊이 알고 싶다면</h2>
        <p className="mt-1 text-center text-sm text-ink-soft">무료 결과가 마음에 들면, 심층 리포트로 이어가세요.</p>
```
아래로 교체:
```tsx
        <h2 className="text-center text-lg font-bold">무료로는 안 보이는 것</h2>
        <p className="mt-1 text-center text-sm text-ink-soft">
          방금 본 건 요약이에요. 재물·직업·연애의 흐름은 따로 있어요.
        </p>
```

- [ ] **Step 3: 차별점 섹션 제목 교체**

`app/page.tsx`에서 `오롭미가 다른 이유` 를 `챗봇 사주는 왜 팔자부터 틀릴까요` 로 교체.

- [ ] **Step 4: 샘플 배너 카피 강화 (검증된 차별점)**

`app/products/page.tsx`에서:
```tsx
            <p className="mt-0.5 text-xs text-ink-soft">
              실제 발급된 리포트 전문을 그대로 공개했어요
            </p>
```
아래로 교체:
```tsx
            <p className="mt-0.5 text-xs text-ink-soft">
              리포트 전문을 통째로 공개해요 — 결제 전에 다 읽어보고 결정하세요
            </p>
```

- [ ] **Step 5: 빌드 확인 후 커밋**

Run: `npm run build`
Expected: `✓ Compiled successfully`

```bash
git add app/page.tsx app/products/page.tsx && git commit -m "feat: 전환 카피 교체 (문제제기형 훅·정보격차·샘플 차별점)"
```

---

### Task 6: 후기 수치 승격 + 환불 보장 명문화

**Files:**
- Modify: `components/ReviewList.tsx`
- Modify: `app/refund/page.tsx`
- Modify: `app/products/page.tsx`

- [ ] **Step 1: 후기 헤드라인에 수치 승격**

`components/ReviewList.tsx`에서:
```tsx
      <h2 className="text-center text-lg font-bold">먼저 받아본 분들의 이야기</h2>
      <p className="mt-1 text-center text-sm text-ink-soft">
        평균 <b className="text-accent-strong">{avg.toFixed(1)}점</b> · 리포트를 실제로 받은{" "}
        {count.toLocaleString()}명이 남긴 후기예요
      </p>
```
아래로 교체:
```tsx
      <h2 className="text-center text-lg font-bold">
        <span className="text-amber-400">★</span> {avg.toFixed(1)} · 후기 {count.toLocaleString()}건
      </h2>
      <p className="mt-1 text-center text-sm text-ink-soft">
        리포트를 실제로 받은 분들만 남길 수 있어요
      </p>
```

- [ ] **Step 2: 환불 정책에 생성 전 100% 환불 명문화**

`app/refund/page.tsx`를 열어 환불 조항 배열 첫 항목으로 아래 문장을 추가한다:
```
"리포트 생성 전(결제 직후 ~ 해석 시작 전)에는 사유를 묻지 않고 100% 환불해드려요. 문의 주시면 바로 처리해드립니다.",
```

- [ ] **Step 3: 상품 페이지 각주에 이유 연결**

`app/products/page.tsx` 하단의 환불 각주 문장을 아래로 교체:
```tsx
        결제 전에 <Link href="/sample" className="underline">샘플로 전문</Link>을 미리 보실 수 있어서,
        생성이 끝난 뒤에는 청약철회가 제한돼요. 생성 전에는 100% 환불해드려요.{" "}
```

- [ ] **Step 4: 빌드 확인**

Run: `npm run build`
Expected: `✓ Compiled successfully`

- [ ] **Step 5: 커밋**

```bash
git add components/ReviewList.tsx app/refund/page.tsx app/products/page.tsx && git commit -m "feat: 후기 수치 승격 + 생성 전 100% 환불 명문화"
```

---

### Task 7: 운영 매뉴얼 갱신 (당근 + SNS)

**Files:**
- Modify: `marketing/danggeun.md`
- Create: `marketing/sns-playbook.md`

- [ ] **Step 1: 당근 가격표를 사다리 구조로 갱신**

`marketing/danggeun.md`의 가격 표에 프리미엄 행을 최상단에 추가하고, 각 행에 "PDF n페이지" 표기를 넣는다. 근거(경쟁사 실측 가격)를 표 아래 각주로 남긴다.

- [ ] **Step 2: 채팅 스크립트에 샘플 링크 우선 배치**

첫 문의 응대 스크립트의 첫 3줄 안에 `/sample` 링크가 오도록 순서를 바꾼다 (조사 결과 8개 경쟁사 중 전문 공개는 0건 = 최강 설득 도구).

- [ ] **Step 3: SNS 플레이북 신규 작성**

`marketing/sns-playbook.md`에 아래 구조로 작성:
- 인스타: 역할(카드뉴스=저장·전환 0.55%, 릴스=신규유입), 발행 슬롯(카드뉴스 화·목·토 10~12시 / 릴스 화·금 9~11시), 프로필 3줄 공식, 하이라이트 3종, 후킹 6유형, 릴스 대본 5개 전문
- 스레드: 첫 줄 공식(숫자·의외성·질문), 8줄 제한, 링크는 답글에만(전체 글의 10~15%), 댓글 유도 이벤트 주 1회, 카테고리 4개 고정, 발행 주 5회
- 두 채널 연동: 카드뉴스 텍스트 요약을 스레드 동시 게시 → 답글로 인스타 링크

- [ ] **Step 4: 커밋**

```bash
git add marketing/ && git commit -m "docs: 당근 가격 사다리 갱신 + SNS 플레이북"
```

---

### Task 8: 전체 검증 및 배포

**Files:** 없음

- [ ] **Step 1: 테스트 전체 실행**

Run: `npx vitest run`
Expected: 모든 테스트 PASS (기존 18 + 신규 6 = 24)

- [ ] **Step 2: 빌드**

Run: `npm run build`
Expected: `✓ Compiled successfully`, 타입 에러 0

- [ ] **Step 3: 배포**

Run: `npx vercel deploy --prod --yes`
Expected: 출력에 `Deploying orobmi/saju-web` 포함 (다른 프로젝트면 중단하고 cwd 확인)

- [ ] **Step 4: 프로덕션 스모크**

```bash
for p in / /products /sample /admin; do echo "$p → $(curl -s -o /dev/null -w '%{http_code}' https://saju-web-orobmi.vercel.app$p)"; done
```
Expected: 전부 200

- [ ] **Step 5: 최종 커밋 및 보고**

```bash
git add -A && git commit -m "chore: 전환 최적화 웨이브 검증 완료" && git push
```

---

## Self-Review

**1. 스펙 커버리지**
- 프리미엄 상품 신설 → Task 1~4 ✓
- 홈페이지 본질 개선(카피 12개 항목 중 핵심 5개) → Task 5~6 ✓
- 당근 운영 → Task 7 ✓
- 인스타·스레드 운영 → Task 7 ✓
- 6가지 도구 제품 확장 → **이 계획에 없음.** 별도 계획으로 분리한다 (현재 최우선은 당근 현금화이며, 신규 진단 도구는 8월 매출에 기여하지 않음).

**2. 플레이스홀더 스캔**
- `<TOKEN>`은 Task 4 Step 1의 출력에서 얻는 실제 값이며, 얻는 방법이 앞 스텝에 명시돼 있으므로 플레이스홀더가 아니다.
- `$ADMIN_KEY`는 `.env.local`에 이미 존재하는 값이다.

**3. 타입 일관성**
- `ProductCode`에 `"deep"`을 추가하므로 `PRODUCTS`는 `Record<ProductCode, Product>` 제약을 만족한다 (Task 1에서 객체에 `deep` 키를 함께 추가).
- `FORMATS`는 `Record<string, ReportFormat>`이라 키 추가에 타입 변경이 불필요하다.
- `pdfPages`/`charCount`는 Task 1에서 인터페이스에 이미 존재(2026-08-05 커밋됨)하므로 재정의하지 않는다.

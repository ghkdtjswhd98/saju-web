# 오롭미 (All of Me) — 사주 웹사이트

무료 맛보기 + 유료 심층 리포트 구조의 AI 사주 서비스.
**팔자·오행·십신은 만세력 데이터 기반 결정론적 계산, Claude는 해석만 담당** (AI 사주의 고질병인 계산 오류 원천 차단).

## 상품 구성

| 상품 | 가격 | 모델 |
|---|---|---|
| 무료 맛보기 (한줄요약+해시태그+성격카드+별점) | 0원 (IP당 3회/일) | claude-haiku-4-5 |
| 평생사주 종합 리포트 | 9,900원 | claude-opus-4-8 |
| 연애·궁합 리포트 (2인) | 12,900원 | claude-opus-4-8 |
| 올해 운세 리포트 (월별 흐름 포함) | 9,900원 | claude-opus-4-8 |
| 직업·재물운 리포트 | 9,900원 | claude-opus-4-8 |

건당 API 원가: 무료 ~35원, 유료 ~175~315원 (트래픽 증가 시 프롬프트 캐싱으로 추가 절감).

## 로컬 실행 준비 (1회)

1. **환경변수**: `.env.example`을 `.env.local`로 복사하고 채우기
2. **Claude API 키**: https://platform.claude.com → API Keys
3. **Supabase (DB)**: https://supabase.com 무료 프로젝트 생성
   - Connect → **Transaction pooler (포트 6543)** 연결 문자열을 `DATABASE_URL`에
   - 테이블 생성: `npx drizzle-kit push`
4. **토스페이먼츠 (테스트)**: https://developers.tosspayments.com → 내 개발정보에서
   테스트 키(`test_ck_`, `test_sk_`) 복사 (사업자등록 없이 발급 가능)
5. **카카오 공유 (선택)**: https://developers.kakao.com → 앱 생성 → JavaScript 키,
   플랫폼(Web)에 도메인 등록. 키가 없으면 카카오 버튼만 숨겨지고 나머지는 정상 동작

```bash
npm install
npx drizzle-kit push   # DB 테이블 생성
npm run dev            # http://localhost:3000
npx vitest run         # 계산 엔진 테스트
```

### 결제 테스트

토스 테스트 키 상태에서 결제위젯 → 아무 카드사 선택 → 테스트 결제 진행 (실제 청구 없음).
결제 승인 후 `/report/[token]`에서 Opus 리포트 스트리밍을 확인.

## 배포 (Vercel)

1. GitHub에 푸시 → Vercel에서 Import
2. 환경변수 전부 등록 (`.env.example` 참고), `NEXT_PUBLIC_SITE_URL`은 배포 도메인으로
3. 개발/베타 기간은 Hobby로 충분. **실제 판매 시작 시 Pro($20/월) 전환** (Hobby는 상업적 사용 금지 약관)

## 라이브 전환 체크리스트 (사업자등록 후)

- [ ] 사업자등록 (간이과세자, 온라인 무료) + 통신판매업 신고
- [ ] 토스페이먼츠 전자결제 신청 → 심사 → **라이브 키 발급**
- [ ] Vercel 환경변수 `NEXT_PUBLIC_TOSS_CLIENT_KEY`/`TOSS_SECRET_KEY`를 `live_` 키로 교체 (코드 수정 불필요)
- [ ] Vercel Pro 전환
- [ ] 이용약관/개인정보처리방침/환불정책 페이지 추가 (PG 심사 요건)
- [ ] 카카오 앱에 실도메인 등록
- [ ] 12월 전: "신년운세" 상품 추가 (시즌 트래픽 12~2월 집중)

## 아키텍처 메모

- `lib/saju/` — 결정론적 계산 엔진 (saju-mvp에서 이식, vitest로 검증)
- `lib/prompts/` — 공유 명리학 레퍼런스(캐싱 프리픽스) + 상품별 출력 형식
- `app/api/free` — 무료 신청 (레이트리밋·24h 중복 방지) → 리포트 행 생성
- `app/api/reports/[token]/stream` — 무료/유료 공용 SSE 생성 (생성 락, 완료 시 DB 저장)
- `app/api/orders` + `app/api/payments/confirm` — 주문 생성(서버 가격 확정) / 토스 승인(금액 검증·멱등)
- 리포트 열람 권한 = 추측 불가 token URL. 유료 리포트 행은 결제 승인 시에만 생성됨
- 무료 결과 OG 이미지: `app/free/[shareId]/opengraph-image.tsx` (한글 폰트 동적 서브셋)

## 원가/사용량 추적

`reports.usage`에 건당 토큰 사용량이 저장됨. Supabase 대시보드에서:

```sql
select product_code, count(*), sum((usage->>'output_tokens')::int) as out_tokens
from reports where status = 'done' group by product_code;
```

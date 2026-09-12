# 사이트 전체 딥네이비 앱 셸 통일 (2026-09-12 사장님 지시)

목표: 홈 v2(딥네이비 + 430px 앱 셸)와 나머지 페이지의 톤을 하나로. "밤(night) 바탕 + 종이(paper) 카드" 체계.

## 규칙
1. **body 전체 night**: app/layout.tsx body에 `theme-night`(globals.css 기존 변수 세트) 적용. 홈의 개별 래퍼는 중복이므로 정리. admin(app/admin/**)만 `theme-day` 래퍼로 라이트 유지.
2. **헤더**: SiteHeader는 모든 경로에서 다크(홈과 동일 마크업). pathname 분기 제거. 우측 아이콘 링크는 /products 유지.
3. **하단 5탭**: layout에서 렌더하되 경로 규칙 — 보임: `/`, `/products`, `/chemi`, `/chemi/[code]`, `/test/ohaeng`(+하위), `/ilgan`(+하위). 숨김: checkout/**, payments/**, report/**, free/**, admin/**, sample, 법률 페이지(terms/privacy/refund). 활성 탭은 pathname 기준. 푸터 하단 여백 규칙(body:has(#home-bottom-tabs))은 그대로 동작.
4. **콘텐츠 폭**: 모든 고객용 페이지 `mx-auto max-w-[430px] px-5`로 통일(기존 max-w-xl → 430). admin 제외.
5. **종이(paper) 카드** = `.theme-day` 래퍼 + 인라인 `--card:#FAF7F2 --bg:#EFE9E0` (홈 무료 폼과 동일). 적용 대상: 입력 폼(FreeForm은 이미 적용, CheckoutForm/PersonFields가 있는 checkout/new, ChemiCreateForm, ChemiLanding 입력 단계, ReviewForm, RefundRequestForm), 긴 본문 읽기 영역(report/[token]의 StreamingReport 본문, free/[shareId]의 해석 텍스트 섹션, sample). 그 외 카드는 night 카드(bg-card #322A42, border #443A58).
6. **버튼**: night에서 주 버튼 = 금박 배경 #FFE9A8 + 네이비 글자 #272132. `bg-accent-strong text-white` 조합을 전수 점검해 night 위에서는 금박/네이비로, paper 카드 안에서는 네이비 배경 #272132 + 금박 글자(홈 폼 CTA와 동일)로 통일. 위험(danger)·보조 버튼은 아웃라인(border #443A58, text #F2EEF9).
7. **하드코딩 색 점검**: bg-white/text-white/border-white 사용처 전수 확인 — paper 카드 안이면 유지, night 위면 토큰(bg-card/text-ink)으로 교체. 링크 색 a: #FFE9A8.
8. **포인트색 1개**(금박). 오행 5색은 차트·라벨에만. 핑크 금지. 이모지 아이콘 금지(기존 이모지가 아이콘 역할이면 SVG로, 텍스트 장식이면 유지 가능).
9. **StickyBuyBar**(상품 상세)·free 결과 하단 CTA 바: night 배경(#17131F/90 blur) + 금박 버튼. 하단 탭과 겹치지 않음(해당 페이지는 탭 숨김).
10. **대비**: 본문 #F2EEF9, 보조 #B9A9DD(≥7:1), 비활성 #8A8398. 카드 위 취소선 정가 #8A8398.
11. **OG 이미지·이메일·PDF·카드 이미지 라우트는 손대지 않음.**
12. 변경 금지: lib/saju/**, API 로직, 가격·상품 데이터, 결제 흐름.

## 검증
tsc · eslint · vitest · next build. 브라우저(375px): /, /products, /products/deep, /checkout/new?product=deep, /free/[shareId], /report/[token](샘플), /chemi, /test/ohaeng, /refund — 흰 배경 잔재·읽기 대비·버튼 색·탭 노출 규칙·스티키 바 확인. admin은 라이트 유지.

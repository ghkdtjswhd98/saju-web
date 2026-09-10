# 홈 v2 설계 — 딥네이비 앱 셸 (2026-09-10 사장님 승인)

결정: 시안 1안(포스터 캐러셀형) 뼈대 + 2안의 크림 입력 카드·훅 카피 조합. 톤 A(딥네이비). **홈 페이지에만 적용**(다른 페이지는 후속 단계).
시각 기준 파일: scratchpad `home-v2-canvas/Main.dc.html`(1안), `HomeFormFirst.dc.html`(2안 폼 카드·훅). 시안 캔버스: https://claude.ai/code/artifact/a2a69ac0-b973-472a-867a-7323ced8e549

## 화면 구성 (위→아래, 390px 기준, 첫 812px 안에 헤더·폼 진입·하단 탭)
1. 헤더(홈에서만 다크): 오롭미 워드마크 + "ALL OF ME" + 우측 리포트 아이콘 링크(/products). `components/SiteHeader.tsx`(client, usePathname)로 layout 헤더 교체 — "/"일 때만 다크 클래스.
2. 카테고리 칩 행(가로 스크롤, 스크롤바 숨김): 전체(활성)·연애·재회·결혼·재물·직업·종합 → 섹션 앵커(#rail-love 등).
3. 전면 포스터 캐러셀 `components/home/PosterCarousel.tsx`(client): deep·bundle·reunion·marriage·year 5장. 카드 폭 87% + 다음 카드 노출, scroll-snap-x, 우상단 "n / 5" 인디케이터(scroll 이벤트). 카드 = `/brand/poster/{code}`(3:2, POSTER_BG 자리표시) + 캡션(shortName · PDF {pdfPages}p / cardTitle / PriceTag sm). 좌상단 "오픈특가 · 9/30까지" 뱃지는 `isLaunchActive()`일 때만.
4. 훅 + 무료 폼: 다크 배경 위 Orobi 44px + h1 "헤어진 그 사람, 올해 내 운, 결혼 시기 — 사주는 뭐라고 할까요?" + p "회원가입 없이 30초 · 만세력으로 정확하게". 바로 아래 기존 `<FreeForm/>`를 `.theme-day` 래퍼(라이트 토큰 복원)로 감싸 크림 카드로 유지. id="free".
5. 하단 5탭 `components/home/BottomTabs.tsx`(홈에서만, fixed bottom, max-w 430 중앙): 홈(/) · 무료사주(#free) · 리포트(/products) · 궁합(/?mode=couple) · 수다방("준비 중" 뱃지, aria-disabled). 탭 높이 ≥ 56px, safe-area-inset-bottom.
6. 레일 3개 `components/home/ProductRail.tsx`(가로 스크롤, 카드 200px, 3:2 포스터 + 캡션): "오롭미 추천 · 먼저 보면 좋은 3종"(deep, bundle, lifetime) / "연애가 고민이라면 · 두 사람 사주로 봐요"(reunion, crush, love, marriage, dohwa, id=rail-love) / "일과 돈, 그리고 나"(career, year, lifetime, id=rail-money). personCount 2 → "2인" 뱃지. 헤더 우측 "전체보기 →"(/products). 결혼·재회 앵커는 연애 레일, 재물·직업 앵커는 일과 돈 레일, 종합은 추천 레일.
7. 무료 도구 3카드: 우리 궁합(/?mode=couple) · 오행 캐릭터 테스트(/test/ohaeng) · 만세력 원국 보기("예정" 뱃지, 링크 없음).
8. 수다방 티저 카드: Orobi + 말풍선 "오늘 뭐가 제일 마음에 걸려요? 내 원국 보면서 같이 얘기해봐요." + "준비 중" 뱃지 + "카톡하듯 사주 수다 · 하루 1번 무료" (버튼 없음).
9. 신뢰 스트립 3칸(만세력으로 계산 / 실판매가만 표기 / 생성 실패 시 자동 환불) + "어떻게 계산하나요" 1문단 축약 + ReviewList + LandingFaq(다크 토큰으로 자연 적용).
10. 홈 컨텐츠 하단 padding-bottom 96px(하단 탭에 안 가리게). 푸터는 layout 공통(라이트 유지 OK).

## 스타일 규칙
- `app/globals.css`에 `.theme-night`(--bg #272132, --card #322A42, --ink #F2EEF9, --ink-soft #B9A9DD, --accent #FFE9A8, --accent-soft #443A58, --border #443A58)와 `.theme-day`(원래 라이트 값 복원), `.no-scrollbar` 추가. `--accent-strong`은 night에서 #FFE9A8로 두되, 흰 글자 버튼(bg-accent-strong text-white) 조합이 깨지므로 홈 전용 CTA는 "bg-[#FFE9A8] text-[#272132]"로 직접 지정.
- 포인트색 1개(금박 #FFE9A8): 탭·칩 활성, CTA, 가격 강조. 핑크 금지. 이모지 아이콘 금지(인라인 SVG 20~24px, stroke 2).
- 가짜 긴박·"N명 보는 중"·허위 정가·근거 없는 인기 문구 금지. 가격은 PriceTag(현재가 앞·크게).
- 앱 셸: 홈 루트 `mx-auto max-w-[430px]`, 데스크톱에서도 같은 폭.
- 접근성: 탭/칩/카드 히트 44px, 대비 4.5:1, 캐러셀 키보드 스크롤(overflow-x auto, tabindex 0).
- 재사용: FreeForm, PriceTag, Orobi, ReviewList, LandingFaq, POSTER_BG, PRODUCTS, getPricing, isLaunchActive.

## 검증
tsc · eslint · vitest · next build 통과. 브라우저(375px): 첫 화면에 헤더·캐러셀·훅·폼 상단·하단 탭, 캐러셀 인디케이터 갱신, 칩 앵커 이동, 폼 제출 → /free 이동 정상, 다른 페이지(products·checkout·free 결과) 회귀 없음(헤더 라이트 유지).

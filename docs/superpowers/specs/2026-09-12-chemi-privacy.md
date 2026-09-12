# 케미 순위 — 비공개 옵션 (2026-09-12 사장님 결정)

## 결정
1. **친구 쪽 비공개**: 친구가 케미 검사할 때 "내 결과는 링크 주인에게만 보여주기(비공개)" 체크(기본: 공개). 비공개 응답은 **링크 주인에게만** 보이고(자물쇠 표시), 다른 친구들 화면에는 이름·점수 없이 "비공개 n명"으로 인원만 반영. 본인은 자기 점수·순위(전체 기준)를 그대로 봄.
2. **주인 쪽 잠금**: 링크 주인이 "순위판 친구에게 공개 / 나만 보기" 토글로 전체 순위판을 잠글 수 있음(기본: 공개 = 상위 5명 노출). 잠그면 친구 화면에는 자기 결과 + "이 순위판은 주인만 볼 수 있어요"만 표시. 초대 링크·검사 자체는 계속 가능.

## 구현 메모
- DB(추가형 마이그레이션): chemi_replies.is_private boolean not null default false, chemi_links.board_public boolean not null default true.
- API: POST replies에 isPrivate; GET links/[code]는 비주인 요청 시 board_public=false면 목록 대신 {locked:true, total}; 공개면 is_private 제외 상위 5 + privateCount. PATCH links/[code](x-owner-key)로 board_public 변경.
- UI: ChemiLanding 입력 단계 체크박스 + 결과 화면 안내문; RankingBoard 주인 뷰 자물쇠 뱃지·비공개 인원, 친구 뷰 잠금 안내; 주인 화면 상단 토글(저장 시 즉시 반영).
- 카피: 부정적 뉘앙스 없이("조용히 올릴게요" 톤).

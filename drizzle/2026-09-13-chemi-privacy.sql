-- 2026-09-13 케미 순위 비공개 옵션 — 순수 추가형(ADD COLUMN IF NOT EXISTS). Session Pooler(5432)로 적용할 것.
-- 적용: npx tsx scripts/migrate-2026-09-13.ts  (또는 이 파일을 Supabase SQL Editor에 붙여넣기)
-- 선행: drizzle/2026-09-12-chemi.sql(테이블 생성)이 먼저 적용돼 있어야 한다.
-- 친구 응답 비공개: 다른 친구 화면엔 "비공개 n명"으로만, 링크 주인에게는 전체 노출
alter table chemi_replies add column if not exists is_private boolean not null default false;
-- 주인 잠금: false면 친구 화면에 순위판 대신 잠금 안내 (초대·검사는 계속 가능)
alter table chemi_links add column if not exists board_public boolean not null default true;

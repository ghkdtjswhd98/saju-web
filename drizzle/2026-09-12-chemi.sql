-- 2026-09-12 케미 초대 링크 — 순수 추가형(IF NOT EXISTS). Session Pooler(5432)로 적용할 것.
-- 적용: npx tsx scripts/migrate-2026-09-12.ts  (또는 이 파일을 Supabase SQL Editor에 붙여넣기)
create table if not exists chemi_links (
  code text primary key,
  nickname text not null,
  saju_subset jsonb not null,
  owner_key text not null,
  created_at timestamptz not null default now()
);
create table if not exists chemi_replies (
  id text primary key,
  link_code text not null references chemi_links(code),
  nickname text not null,
  score integer not null,
  label text not null,
  created_at timestamptz not null default now()
);
create index if not exists chemi_replies_link_code_idx on chemi_replies (link_code);

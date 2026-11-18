-- 저장한 글: 변환 결과의 사본. 주소당 한 건만 두고, 소유자만 읽고 쓰고 지운다.
create table public.saved_articles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  source_url text not null,
  title text not null default '',
  author text not null default '',
  domain text not null,
  markdown text not null,
  saved_at timestamptz not null default now(),
  unique (user_id, source_url)
);

alter table public.saved_articles enable row level security;

grant select, insert, update, delete on public.saved_articles to authenticated;

-- UPDATE 는 SELECT 정책도 필요하고, WITH CHECK 가 없으면 소유자를 바꿀 수 있다.
create policy "saved_articles_select_own" on public.saved_articles
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "saved_articles_insert_own" on public.saved_articles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "saved_articles_update_own" on public.saved_articles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "saved_articles_delete_own" on public.saved_articles
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 목록은 saved_at 최신순으로 사용자별로 읽는다.
create index saved_articles_user_saved_at_idx
  on public.saved_articles (user_id, saved_at desc);

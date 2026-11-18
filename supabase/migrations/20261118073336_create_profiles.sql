-- 사용자 프로필: auth.users 와 1:1, 본인만 읽고 수정할 수 있다.
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text
);

alter table public.profiles enable row level security;

-- 로그인한 사용자에게만 필요한 권한을 준다 (anon 에는 주지 않는다).
grant select, update on public.profiles to authenticated;

-- UPDATE 는 SELECT 정책도 필요하므로 둘 다 만든다.
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 가입하면 프로필 행을 만든다. 실패하면 가입이 막히므로 단순하게 유지한다.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

-- 트리거 전용 함수이므로 API 로 직접 호출하지 못하게 한다.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

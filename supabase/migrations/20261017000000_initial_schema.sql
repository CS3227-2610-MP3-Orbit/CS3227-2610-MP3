-- Initial schema: user profiles (roles) and AI usage accounting.
-- Feature tables are added by later migrations, each defined by an approved spec.
-- Row-level security is enabled on every table and access is denied unless a policy allows it.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('student', 'lecturer', 'admin');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role public.app_role not null default 'student',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Written and read only by the server (secret key) to enforce SoC LLM usage quotas.
create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  feature text not null,
  created_at timestamptz not null default now()
);

create index ai_usage_user_recent_idx on public.ai_usage (user_id, created_at desc);
create index ai_usage_recent_idx on public.ai_usage (created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Role of the signed-in user, or null if signed out or deactivated.
-- Policies use this rather than auth.uid() alone, so deactivated users lose access
-- even while their session token is still valid.
create function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid()) and is_active
$$;

-- Every new auth user gets a student profile. The role is never taken from sign-up metadata,
-- because that metadata is controlled by the user.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.ai_usage enable row level security;

-- profiles: users read their own row (to learn their role and status); active users read staff;
-- administrators read and update everyone.
create policy "profiles: read own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: active users read staff" on public.profiles
  for select to authenticated
  using ((select public.current_app_role()) is not null and role in ('lecturer', 'admin'));

create policy "profiles: admin reads all" on public.profiles
  for select to authenticated
  using ((select public.current_app_role()) = 'admin');

create policy "profiles: admin updates" on public.profiles
  for update to authenticated
  using ((select public.current_app_role()) = 'admin')
  with check ((select public.current_app_role()) = 'admin');

-- ai_usage: no policies; only the server's secret key can read or write it.

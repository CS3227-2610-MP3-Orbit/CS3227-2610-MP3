-- [SH-06-AC12] public.password_change_attempts: RLS enabled, no policies, and anon/authenticated
-- can neither select, insert, update, nor delete it directly; only the service-role client
-- (which bypasses RLS and privilege checks entirely) may touch it, exactly like public.ai_usage.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(12);

select has_table('public', 'password_change_attempts', 'password_change_attempts table exists');

select ok(
  (select rowsecurity from pg_tables
    where schemaname = 'public' and tablename = 'password_change_attempts'),
  '[SH-06-AC12] row-level security is enabled on password_change_attempts'
);

select is_empty(
  $$ select policyname from pg_policies
      where schemaname = 'public' and tablename = 'password_change_attempts' $$,
  '[SH-06-AC12] password_change_attempts has no policies'
);

-- Privilege-level checks: no grant exists at all, independent of RLS/policy state.
select ok(
  not has_table_privilege('authenticated', 'public.password_change_attempts', 'SELECT'),
  '[SH-06-AC12] authenticated has no SELECT privilege on password_change_attempts'
);
select ok(
  not has_table_privilege('authenticated', 'public.password_change_attempts', 'INSERT'),
  '[SH-06-AC12] authenticated has no INSERT privilege on password_change_attempts'
);
select ok(
  not has_table_privilege('authenticated', 'public.password_change_attempts', 'UPDATE'),
  '[SH-06-AC12] authenticated has no UPDATE privilege on password_change_attempts'
);
select ok(
  not has_table_privilege('authenticated', 'public.password_change_attempts', 'DELETE'),
  '[SH-06-AC12] authenticated has no DELETE privilege on password_change_attempts'
);
select ok(
  not has_table_privilege('anon', 'public.password_change_attempts', 'SELECT'),
  '[SH-06-AC12] anon has no SELECT privilege on password_change_attempts'
);
select ok(
  not has_table_privilege('anon', 'public.password_change_attempts', 'INSERT'),
  '[SH-06-AC12] anon has no INSERT privilege on password_change_attempts'
);

-- Fixture for the direct-statement checks below. Written as the table owner, exactly as a
-- migration/service-role script would; everything rolls back at the end.
insert into auth.users (id) values ('84000000-0000-4000-8000-000000000001');
insert into public.password_change_attempts (user_id)
  values ('84000000-0000-4000-8000-000000000001');

-- Direct statements, as each role, are refused before even reaching RLS (no grant at all).
set local role authenticated;
set local request.jwt.claim.sub = '84000000-0000-4000-8000-000000000001';
select throws_ok(
  $$select * from public.password_change_attempts$$,
  '42501',
  null,
  '[SH-06-AC12] authenticated direct SELECT is refused'
);
select throws_ok(
  $$insert into public.password_change_attempts (user_id)
      values ('84000000-0000-4000-8000-000000000001')$$,
  '42501',
  null,
  '[SH-06-AC12] authenticated direct INSERT is refused'
);
reset role;

set local role anon;
select throws_ok(
  $$select * from public.password_change_attempts$$,
  '42501',
  null,
  '[SH-06-AC12] anon direct SELECT is refused'
);
reset role;

select * from finish();
rollback;

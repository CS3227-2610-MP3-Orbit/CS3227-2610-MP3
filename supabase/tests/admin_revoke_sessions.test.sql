-- ADM-01-R10 database-layer verification: admin_revoke_sessions.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select has_function('public', 'admin_revoke_sessions', array['uuid'],
  '[ADM-01-R10] admin_revoke_sessions RPC exists');

-- Isolate from seed data, same as admin_account_management.test.sql: existing administrators
-- would otherwise interfere with the self/protected checks below, and only one protected
-- administrator may exist at a time.
update public.profiles set role = 'student', is_protected = false where role = 'admin';

-- Fixtures. All writes roll back at the end, even on the disposable local DB.
insert into auth.users (id) values
  ('84000000-0000-4000-8000-000000000001'), -- admin_actor: acting admin
  ('84000000-0000-4000-8000-000000000002'), -- admin_protected: protected recovery admin
  ('84000000-0000-4000-8000-000000000003'), -- target: has live sessions to revoke
  ('84000000-0000-4000-8000-000000000004'); -- lecturer_actor: non-admin caller

update public.profiles set role = 'admin'
  where id in ('84000000-0000-4000-8000-000000000001', '84000000-0000-4000-8000-000000000002');
update public.profiles set role = 'lecturer' where id = '84000000-0000-4000-8000-000000000004';

-- Only a migration/service-role script may set this flag in production; the test simulates
-- that role by writing it directly as the table owner, exactly as ADM-01-R8 already does.
update public.profiles set is_protected = true where id = '84000000-0000-4000-8000-000000000002';

-- Two live sessions (and a refresh token each) for the target, plus one session belonging to
-- someone else, so the test can confirm only the target's own rows are ever removed.
insert into auth.sessions (id, user_id) values
  ('85000000-0000-4000-8000-000000000001', '84000000-0000-4000-8000-000000000003'),
  ('85000000-0000-4000-8000-000000000002', '84000000-0000-4000-8000-000000000003'),
  ('85000000-0000-4000-8000-000000000003', '84000000-0000-4000-8000-000000000001');
insert into auth.refresh_tokens (token, user_id, session_id) values
  ('adm01-revoke-test-token-a', '84000000-0000-4000-8000-000000000003',
    '85000000-0000-4000-8000-000000000001'),
  ('adm01-revoke-test-token-b', '84000000-0000-4000-8000-000000000003',
    '85000000-0000-4000-8000-000000000002'),
  ('adm01-revoke-test-token-c', '84000000-0000-4000-8000-000000000001',
    '85000000-0000-4000-8000-000000000003');

set local role authenticated;
set local request.jwt.claim.sub = '84000000-0000-4000-8000-000000000001';
select is(public.current_app_role()::text, 'admin', 'fixture admin_actor identity validated');

-- [ADM-01-AC23] a non-admin caller is refused; no row removed.
set local request.jwt.claim.sub = '84000000-0000-4000-8000-000000000004';
select is(
  public.admin_revoke_sessions('84000000-0000-4000-8000-000000000003')->>'kind',
  'forbidden_or_not_found',
  '[ADM-01-AC23] non-admin (lecturer) caller is refused'
);

set local request.jwt.claim.sub = '84000000-0000-4000-8000-000000000001';

-- [ADM-01-AC23] the caller's own id is refused, regardless of whether they even hold a session.
select is(
  public.admin_revoke_sessions('84000000-0000-4000-8000-000000000001')->>'kind',
  'forbidden_self_change',
  '[ADM-01-AC23] admin cannot revoke their own sessions via this RPC'
);

-- [ADM-01-AC23] the protected recovery administrator is refused as a target.
select is(
  public.admin_revoke_sessions('84000000-0000-4000-8000-000000000002')->>'kind',
  'forbidden_protected',
  '[ADM-01-AC23] the protected recovery administrator cannot be targeted'
);

-- [ADM-01-AC23] an unknown target is refused.
select is(
  public.admin_revoke_sessions('84000000-0000-4000-8000-00000000ffff')->>'kind',
  'forbidden_or_not_found',
  '[ADM-01-AC23] an unknown target id is refused'
);

-- Read back as the table owner: authenticated has no SELECT privilege on auth.sessions at all
-- (it is RLS-enabled with no policies, and the table grant itself is owner-only), so every
-- direct row-count check below runs after "reset role", restoring the caller's role/claim
-- immediately afterward for the next RPC call. Filtered to this test's own fixture ids, not a
-- bare `count(*)` -- this is a shared local database and another row can legitimately exist
-- (e.g. a concurrently running real sign-in elsewhere), so only the fixture rows this test
-- itself inserted are a meaningful assertion.
reset role;
select is(
  (select count(*)::int from auth.sessions where user_id = '84000000-0000-4000-8000-000000000003'),
  2,
  '[ADM-01-AC23] no auth.sessions row was removed by any refused attempt'
);
set local role authenticated;
set local request.jwt.claim.sub = '84000000-0000-4000-8000-000000000001';

-- [ADM-01-AC24] a valid, non-self, non-protected target: every one of its auth.sessions rows
-- (and, by the on-delete-cascade relationship, their refresh tokens) is removed.
select is(
  public.admin_revoke_sessions('84000000-0000-4000-8000-000000000003')->>'kind',
  'success',
  '[ADM-01-AC24] admin_actor revokes target''s sessions'
);

reset role;
select is(
  (select count(*)::int from auth.sessions where user_id = '84000000-0000-4000-8000-000000000003'),
  0,
  '[ADM-01-AC24] all of the target''s auth.sessions rows are removed'
);
select is(
  (select count(*)::int from auth.refresh_tokens where user_id = '84000000-0000-4000-8000-000000000003'),
  0,
  '[ADM-01-AC24] the target''s refresh tokens are cascaded away with their sessions'
);
select is(
  (select count(*)::int from auth.sessions where user_id = '84000000-0000-4000-8000-000000000001'),
  1,
  '[ADM-01-AC24] another user''s session is left untouched'
);
select is(
  (select count(*)::int from auth.refresh_tokens where user_id = '84000000-0000-4000-8000-000000000001'),
  1,
  '[ADM-01-AC24] another user''s refresh token is left untouched'
);
set local role authenticated;
set local request.jwt.claim.sub = '84000000-0000-4000-8000-000000000001';

-- A target with no sessions at all is still a success (nothing to revoke is not a failure).
select is(
  public.admin_revoke_sessions('84000000-0000-4000-8000-000000000003')->>'kind',
  'success',
  '[ADM-01-AC24] revoking again for a target with no remaining sessions still succeeds'
);

-- Non-admin and signed-out callers get the same refusal as any other admin-only path.
set local request.jwt.claim.sub = '84000000-0000-4000-8000-000000000004';
select is(
  public.admin_revoke_sessions('84000000-0000-4000-8000-000000000001')->>'kind',
  'forbidden_or_not_found',
  '[ADM-01-AC23] non-admin caller is refused regardless of target'
);
reset role;

-- anon has no execute grant at all: the call never reaches the function body.
set local role anon;
select throws_ok(
  $$select public.admin_revoke_sessions('84000000-0000-4000-8000-000000000001')$$,
  '42501',
  null,
  '[ADM-01-AC23] signed-out (anon) direct RPC call is refused before execution'
);
reset role;

select * from finish();
rollback;

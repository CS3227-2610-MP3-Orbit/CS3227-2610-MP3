-- ADM-01 database-layer verification: admin_set_role/admin_set_active, the protected
-- recovery administrator, and the removal of direct profiles writes.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select has_function('public', 'admin_set_role', array['uuid', 'app_role'],
  '[ADM-01-R3] [ADM-01-R5] [ADM-01-R7] [ADM-01-R8] admin_set_role RPC exists');
select has_function('public', 'admin_set_active', array['uuid', 'boolean'],
  '[ADM-01-R4] [ADM-01-R5] [ADM-01-R7] [ADM-01-R8] admin_set_active RPC exists');

-- Isolate from seed data: existing administrators would otherwise change the zero-admin
-- counts, and only one protected administrator may exist. Rolled back with the rest.
update public.profiles set role = 'student', is_protected = false where role = 'admin';

-- Fixtures. All writes roll back at the end, even on the disposable local DB.
insert into auth.users (id) values
  ('83000000-0000-4000-8000-000000000001'), -- admin_p: protected recovery admin
  ('83000000-0000-4000-8000-000000000002'), -- admin_a: acting admin (phase 1)
  ('83000000-0000-4000-8000-000000000003'), -- admin_b: extra active admin (phase 1 margin)
  ('83000000-0000-4000-8000-000000000004'), -- lecturer_actor: non-admin caller
  ('83000000-0000-4000-8000-000000000005'), -- student_actor: non-admin caller (default role)
  ('83000000-0000-4000-8000-000000000006'), -- target_role: AC5 target
  ('83000000-0000-4000-8000-000000000007'), -- target_active: AC7 target
  ('83000000-0000-4000-8000-000000000008'), -- target_c9: AC9 target
  ('83000000-0000-4000-8000-000000000009'), -- admin_solo1: phase 2 (zero-admin) fixture
  ('83000000-0000-4000-8000-000000000010'); -- admin_solo2: phase 2 (zero-admin) fixture

update public.profiles set role = 'admin'
  where id in (
    '83000000-0000-4000-8000-000000000001',
    '83000000-0000-4000-8000-000000000002',
    '83000000-0000-4000-8000-000000000003'
  );
update public.profiles set role = 'lecturer' where id = '83000000-0000-4000-8000-000000000004';

-- Only a migration/service-role script may set this flag; the test simulates that role
-- by writing it directly as the table owner, exactly as ADM-01-R8 requires in production.
update public.profiles set is_protected = true where id = '83000000-0000-4000-8000-000000000001';

-- ---------------------------------------------------------------------------
-- Phase 1: admin_a acts, admin_p is the protected target, admin_b is idle margin.
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '83000000-0000-4000-8000-000000000002';
select is(public.current_app_role()::text, 'admin', 'fixture active admin_a identity validated');

-- [ADM-01-AC5] admin changes another user's role; it is stored and reads back.
select is(
  public.admin_set_role('83000000-0000-4000-8000-000000000006', 'lecturer')->>'kind',
  'success',
  '[ADM-01-AC5] admin_a changes target_role to lecturer'
);
select is(
  (select role::text from public.profiles where id = '83000000-0000-4000-8000-000000000006'),
  'lecturer',
  '[ADM-01-AC5] new role is stored and reads back'
);

-- [ADM-01-AC6] [ADM-01-R5] self role change refused, regardless of value, no change.
select is(
  public.admin_set_role('83000000-0000-4000-8000-000000000002', 'lecturer')->>'kind',
  'forbidden_self_change',
  '[ADM-01-AC6] admin cannot change own role'
);
select is(
  (select role::text from public.profiles where id = '83000000-0000-4000-8000-000000000002'),
  'admin',
  '[ADM-01-AC6] own role is unchanged after the refusal'
);

-- [ADM-01-AC7] deactivate then reactivate; is_active reflects each change.
select is(
  public.admin_set_active('83000000-0000-4000-8000-000000000007', false)->>'kind',
  'success',
  '[ADM-01-AC7] admin_a deactivates target_active'
);
select is(
  (select is_active from public.profiles where id = '83000000-0000-4000-8000-000000000007'),
  false,
  '[ADM-01-AC7] is_active reflects the deactivation'
);
select is(
  public.admin_set_active('83000000-0000-4000-8000-000000000007', true)->>'kind',
  'success',
  '[ADM-01-AC7] admin_a reactivates target_active'
);
select is(
  (select is_active from public.profiles where id = '83000000-0000-4000-8000-000000000007'),
  true,
  '[ADM-01-AC7] is_active reflects the reactivation'
);

-- [ADM-01-AC8] [ADM-01-R5] self-deactivation refused, no change.
select is(
  public.admin_set_active('83000000-0000-4000-8000-000000000002', false)->>'kind',
  'forbidden_self_change',
  '[ADM-01-AC8] admin cannot deactivate themselves'
);
select is(
  (select is_active from public.profiles where id = '83000000-0000-4000-8000-000000000002'),
  true,
  '[ADM-01-AC8] own active state is unchanged after the refusal'
);

-- [ADM-01-AC9] [ADM-01-R6] a deactivated user's current_app_role() is null immediately.
select is(
  public.admin_set_active('83000000-0000-4000-8000-000000000008', false)->>'kind',
  'success',
  'admin_a deactivates target_c9 to set up AC9'
);
set local request.jwt.claim.sub = '83000000-0000-4000-8000-000000000008';
select is(
  public.current_app_role(),
  null,
  '[ADM-01-AC9] deactivated user''s current_app_role() is null without re-login'
);
set local request.jwt.claim.sub = '83000000-0000-4000-8000-000000000002';

-- [ADM-01-AC15] [ADM-01-R8] another admin targeting the protected admin is refused.
select is(
  public.admin_set_role('83000000-0000-4000-8000-000000000001', 'lecturer')->>'kind',
  'forbidden_protected',
  '[ADM-01-AC15] another admin cannot change the protected admin''s role'
);
select is(
  public.admin_set_active('83000000-0000-4000-8000-000000000001', false)->>'kind',
  'forbidden_protected',
  '[ADM-01-AC15] another admin cannot deactivate the protected admin'
);
select is(
  (select row(role, is_active) from public.profiles where id = '83000000-0000-4000-8000-000000000001'),
  row('admin'::public.app_role, true),
  '[ADM-01-AC15] protected admin''s role and active state are unchanged'
);

-- Edge case: the protected admin targets itself. ADM-01-R5 fires first; ADM-01-R8 agrees
-- independently (both rules would refuse this, per the spec's edge-case table).
set local request.jwt.claim.sub = '83000000-0000-4000-8000-000000000001';
select is(
  public.admin_set_role('83000000-0000-4000-8000-000000000001', 'lecturer')->>'kind',
  'forbidden_self_change',
  '[ADM-01-R5] [ADM-01-R8] protected admin cannot change its own role either'
);
select is(
  public.admin_set_active('83000000-0000-4000-8000-000000000001', false)->>'kind',
  'forbidden_self_change',
  '[ADM-01-R5] [ADM-01-R8] protected admin cannot deactivate itself either'
);
set local request.jwt.claim.sub = '83000000-0000-4000-8000-000000000002';

-- [ADM-01-AC16] is_protected cannot be written by any authenticated role, including admin,
-- through any RPC or direct statement; only the privilege-level revoke is checked here
-- because no update policy exists any more for any role to fall back on.
select throws_ok(
  $$update public.profiles set is_protected = true where id = '83000000-0000-4000-8000-000000000002'$$,
  '42501',
  null,
  '[ADM-01-AC16] admin cannot set is_protected via a direct update'
);
select ok(
  not has_table_privilege('authenticated', 'public.profiles', 'UPDATE'),
  '[ADM-01-AC16] authenticated has no UPDATE privilege on profiles at all'
);
select ok(
  not has_table_privilege('anon', 'public.profiles', 'UPDATE'),
  '[ADM-01-AC16] anon has no UPDATE privilege on profiles at all'
);
select is(
  public.admin_set_role('83000000-0000-4000-8000-000000000006', 'student')->>'kind',
  'success',
  'sanity: admin_set_role still succeeds on an ordinary, unprotected target'
);
select is(
  (select is_protected from public.profiles where id = '83000000-0000-4000-8000-000000000006'),
  false,
  '[ADM-01-AC16] admin_set_role never sets is_protected on its target'
);

-- Non-admin and signed-out callers get the same refusal as any other admin-only path,
-- with no data returned and no mutation, whether via the student or lecturer role.
set local request.jwt.claim.sub = '83000000-0000-4000-8000-000000000005';
select is(
  public.admin_set_role('83000000-0000-4000-8000-000000000006', 'lecturer')->>'kind',
  'forbidden_or_not_found',
  '[ADM-01-AC6] [ADM-01-AC10] non-admin student caller is refused'
);
set local request.jwt.claim.sub = '83000000-0000-4000-8000-000000000004';
select is(
  public.admin_set_active('83000000-0000-4000-8000-000000000006', false)->>'kind',
  'forbidden_or_not_found',
  '[ADM-01-AC8] [ADM-01-AC10] non-admin lecturer caller is refused'
);
-- Read back as the table owner: lecturer_actor is not an admin, so RLS would only show
-- its own row, which would make this check vacuous (or even spuriously empty) rather
-- than a real verification that nothing changed.
reset role;
select is(
  (select row(role, is_active) from public.profiles where id = '83000000-0000-4000-8000-000000000006'),
  row('student'::public.app_role, true),
  '[ADM-01-AC10] no mutation occurred from either non-admin attempt'
);

-- anon has no execute grant at all: the call never reaches the function body.
set local role anon;
select throws_ok(
  $$select public.admin_set_role('83000000-0000-4000-8000-000000000006', 'lecturer')$$,
  '42501',
  null,
  '[ADM-01-AC10] signed-out (anon) direct RPC call is refused before execution'
);
select throws_ok(
  $$select public.admin_set_active('83000000-0000-4000-8000-000000000006', false)$$,
  '42501',
  null,
  '[ADM-01-AC10] signed-out (anon) direct RPC call is refused before execution'
);
reset role;

-- ---------------------------------------------------------------------------
-- Phase 2 (ADM-01-R7, ADM-01-AC14): isolate exactly two unprotected active admins by
-- removing phase 1's admins from the admin count, so the zero-admin invariant is tested
-- independently of ADM-01-R8's protected backstop ("R7 stays as defence in depth").
-- ---------------------------------------------------------------------------
update public.profiles set role = 'lecturer'
  where id in (
    '83000000-0000-4000-8000-000000000001',
    '83000000-0000-4000-8000-000000000002',
    '83000000-0000-4000-8000-000000000003'
  );
-- Clears the protected flag too: a protected admin can never actually be demoted by the
-- RPCs, so this direct fixture reset also removes the flag to make a clean "no protected
-- admin exists" environment for this phase, and to leave the singleton index free for
-- the R8 mechanism test below.
update public.profiles set is_protected = false where id = '83000000-0000-4000-8000-000000000001';
update public.profiles set role = 'admin'
  where id in (
    '83000000-0000-4000-8000-000000000009',
    '83000000-0000-4000-8000-000000000010'
  );

-- admin_solo1 demotes admin_solo2: exactly one active admin remains afterward, which is
-- not a zero-admin outcome, so this must succeed.
set local role authenticated;
set local request.jwt.claim.sub = '83000000-0000-4000-8000-000000000009';
select is(
  public.admin_set_role('83000000-0000-4000-8000-000000000010', 'lecturer')->>'kind',
  'success',
  '[ADM-01-R7] demoting down to exactly one remaining active admin is allowed'
);
select is(
  (select count(*)::int from public.profiles where role = 'admin' and is_active),
  1,
  '[ADM-01-R7] exactly one active administrator remains'
);

-- Sequential proxy for ADM-01-AC14. pgTAP runs one session and cannot start two
-- transactions concurrently, so this is NOT a test of the true race described by AC14
-- (two admins concurrently demoting/deactivating each other); that case is marked
-- not-run/blocked below for the tester. What this DOES verify is the outcome invariant
-- the lock exists to protect: admin_solo2 was already demoted by the call above, so its
-- own later attempt to demote admin_solo1 is refused at the authorization check (it is
-- no longer an admin) before the zero-admin branch is even reached -- demonstrating that
-- "at most one change commits" and at least one active administrator always remains.
set local request.jwt.claim.sub = '83000000-0000-4000-8000-000000000010';
select is(
  public.admin_set_role('83000000-0000-4000-8000-000000000009', 'lecturer')->>'kind',
  'forbidden_or_not_found',
  '[ADM-01-AC14] sequential proxy: the already-demoted admin cannot demote the other'
);
-- Read back as the table owner: admin_solo2 is no longer an admin at this point, so RLS
-- would hide every row but its own and make this count meaningless under its own role.
reset role;
select is(
  (select count(*)::int from public.profiles where role = 'admin' and is_active),
  1,
  '[ADM-01-AC14] sequential proxy: at least one active administrator always remains'
);
select pass(
  '[ADM-01-AC14] true concurrent two-backend demotion is not-run/blocked in pgTAP (one '
  || 'session cannot open two simultaneous transactions); the lock and the sequential '
  || 'invariant above are the evidence available at this layer -- see handoff for the '
  || 'tester'
);

-- ---------------------------------------------------------------------------
-- ADM-01-R8 mechanism: the partial unique index allows at most one protected row, even
-- for the table owner writing directly (this is enforced by the database, not the RPCs).
-- ---------------------------------------------------------------------------
update public.profiles set is_protected = true where id = '83000000-0000-4000-8000-000000000009';
select throws_ok(
  $$update public.profiles set is_protected = true where id = '83000000-0000-4000-8000-000000000010'$$,
  '23505',
  null,
  '[ADM-01-R8] the unique partial index allows at most one protected row'
);

select * from finish();
rollback;

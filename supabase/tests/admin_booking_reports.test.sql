-- ADM-04 database-layer verification, focused on what is safest and most authoritative to check
-- directly in SQL rather than through tests/integration/admin-reports.test.ts's real-REST calls:
--   - admin_get_booking_report exists with the documented signature (the deep shape/security/
--     minimization checks already live in the vitest integration suite against real fixtures).
--   - ADM-04-R10/AC15's quota-allowlist math, including the "100 existing successes" edge --
--     done here, inside a rolled-back transaction, specifically so inserting 100 synthetic
--     ai_usage rows never touches the shared local stack's real daily AI capacity (unlike a
--     vitest/REST test, pgTAP's fixtures never commit).
-- Mirrors ADM-02's admin_courses.test.sql and STU-05's student_improve_request.test.sql in
-- structure and fixture-isolation style.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select has_function(
  'public', 'admin_get_booking_report', array['text', 'text'],
  '[ADM-04-R2] [ADM-04-R4] admin_get_booking_report RPC exists'
);
select has_function(
  'public', 'claim_ai_attempt', array['uuid', 'text'],
  '[ADM-04-R10] claim_ai_attempt keeps the same signature after being re-created'
);

-- This fixture is intended for a disposable migrated database. Every change rolls back.
delete from public.ai_usage;

-- Self-contained fixtures (the handle_new_user trigger creates each profile row); claim_ai_attempt
-- itself does not check role, only that the feature name is admitted, so the default student
-- role from that trigger is fine for both fixture identities below.
insert into auth.users (id) values
  ('89000000-0000-4000-8000-000000000001'), -- student_actor (admits student.improve-request)
  ('89000000-0000-4000-8000-000000000002'), -- admin_actor (admits admin.activity-summary)
  ('89000000-0000-4000-8000-000000000003'); -- lecturer_actor (admits lecturer.ai-briefing)

select set_config('adm04.student', '89000000-0000-4000-8000-000000000001', true);
select set_config('adm04.admin', '89000000-0000-4000-8000-000000000002', true);
select set_config('adm04.lecturer', '89000000-0000-4000-8000-000000000003', true);

-- ---------------------------------------------------------------------------
-- [ADM-04-AC15] both admitted features share one daily count and keep the per-user in-flight
-- guard; every other feature name is still refused.
-- ---------------------------------------------------------------------------

select set_config(
  'adm04.attempt_student',
  public.claim_ai_attempt(current_setting('adm04.student')::uuid, 'student.improve-request')
    ->> 'attemptId',
  true
);
select is(
  public.claim_ai_attempt(current_setting('adm04.student')::uuid, 'student.improve-request') ->> 'kind',
  'in_flight',
  '[ADM-04-AC15] a second overlapping student.improve-request attempt (same user) is refused'
);
select is(
  public.resolve_ai_attempt(current_setting('adm04.attempt_student')::bigint, 'succeeded'),
  true,
  '[ADM-04-AC15] the first student.improve-request attempt resolves as succeeded'
);

select set_config(
  'adm04.attempt_admin',
  public.claim_ai_attempt(current_setting('adm04.admin')::uuid, 'admin.activity-summary') ->> 'attemptId',
  true
);
select isnt(
  public.claim_ai_attempt(current_setting('adm04.admin')::uuid, 'admin.activity-summary') ->> 'kind',
  'admitted',
  '[ADM-04-AC15] a second overlapping admin.activity-summary attempt (same user) is refused, not re-admitted'
);
select is(
  public.resolve_ai_attempt(current_setting('adm04.attempt_admin')::bigint, 'succeeded'),
  true,
  '[ADM-04-AC15] the admin.activity-summary attempt resolves as succeeded'
);
select is(
  (select count(*)::int from public.ai_usage where state = 'succeeded'),
  2,
  '[ADM-04-AC15] both features successfully recorded against the one shared global count'
);
select is(
  public.claim_ai_attempt(current_setting('adm04.admin')::uuid, 'lecturer.some-other-feature') ->> 'kind',
  'unavailable',
  '[ADM-04-AC15] an unlisted feature name is refused as unavailable, not admitted'
);
select is(
  public.claim_ai_attempt(current_setting('adm04.lecturer')::uuid, 'lecturer.ai-briefing') ->> 'kind',
  'admitted',
  '[ADM-04-AC15] LEC-04''s lecturer.ai-briefing is admitted'
);

-- 100 existing successes (today, SGT) refuse BOTH admitted features with quota_exceeded.
delete from public.ai_usage;
insert into public.ai_usage (user_id, feature, state, admission_day)
select
  current_setting('adm04.student')::uuid,
  'student.improve-request',
  'succeeded',
  (clock_timestamp() at time zone 'Asia/Singapore')::date
from generate_series(1, 100);

select is(
  public.claim_ai_attempt(current_setting('adm04.student')::uuid, 'student.improve-request') ->> 'kind',
  'quota_exceeded',
  '[ADM-04-AC15] student.improve-request is refused once the shared 100/day count is reached'
);
select is(
  public.claim_ai_attempt(current_setting('adm04.admin')::uuid, 'admin.activity-summary') ->> 'kind',
  'quota_exceeded',
  '[ADM-04-AC15] admin.activity-summary is refused by that SAME shared 100/day count'
);
select is(
  public.claim_ai_attempt(current_setting('adm04.lecturer')::uuid, 'lecturer.ai-briefing') ->> 'kind',
  'quota_exceeded',
  '[ADM-04-AC15] lecturer.ai-briefing is refused by that SAME shared 100/day count'
);

-- ---------------------------------------------------------------------------
-- [ADM-04-AC5] direct RPC access to the report and the accounting RPC each stay refused for a
-- non-service-role caller (defense in depth below the application layer).
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '89000000-0000-4000-8000-000000000001';
select is(
  public.current_app_role()::text,
  'student',
  'fixture student_actor has the trigger''s default student role, not admin'
);
select is(
  public.admin_get_booking_report('2026-01-01', '2026-01-02') ->> 'kind',
  'forbidden_or_not_found',
  '[ADM-04-AC5] a non-admin authenticated caller is refused by admin_get_booking_report directly'
);
select throws_ok(
  $$select public.claim_ai_attempt('89000000-0000-4000-8000-000000000001', 'admin.activity-summary')$$,
  '42501',
  null,
  '[ADM-04-AC15] authenticated browser role still cannot call the server-only accounting RPC directly'
);

reset role;
set local role anon;
select throws_ok(
  $$select public.admin_get_booking_report('2026-01-01', '2026-01-02')$$,
  '42501',
  null,
  '[ADM-04-AC5] signed-out (anon) direct RPC call to admin_get_booking_report is refused before execution'
);

select * from finish();
rollback;

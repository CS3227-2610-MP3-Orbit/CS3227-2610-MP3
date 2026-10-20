-- ADM-02 database-layer verification: the admin course/assignment RPCs, the normalized-code
-- unique index, browse-visibility interaction with course deactivation (R3), re-assignment
-- after removal (R6), and the admin-only mutation boundary (R8). Mirrors ADM-01's
-- admin_account_management.test.sql in structure, fixture-isolation, and role-switching style
-- (every raw table read/write bypassing the RPCs is done after "reset role" back to the table
-- owner, exactly like ADM-01's own tests, since "authenticated" has no direct table grants).
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select has_function('public', 'admin_create_course', array['text', 'text'],
  '[ADM-02-R1] [ADM-02-R8] admin_create_course RPC exists');
select has_function('public', 'admin_update_course', array['uuid', 'text', 'text'],
  '[ADM-02-R2] [ADM-02-R8] admin_update_course RPC exists');
select has_function('public', 'admin_set_course_active', array['uuid', 'boolean'],
  '[ADM-02-R3] [ADM-02-R8] admin_set_course_active RPC exists');
select has_function('public', 'admin_list_courses', array['text', 'boolean'],
  '[ADM-02-R7] [ADM-02-R8] admin_list_courses RPC exists');
select has_function('public', 'admin_assign_lecturer', array['uuid', 'uuid'],
  '[ADM-02-R4] [ADM-02-R8] admin_assign_lecturer RPC exists');
select has_function('public', 'admin_remove_assignment', array['uuid'],
  '[ADM-02-R5] [ADM-02-R8] admin_remove_assignment RPC exists');
select has_index('public', 'courses', 'courses_code_normalized_idx',
  '[ADM-02-R1] normalized-code unique index exists on courses');

-- Fixtures (run as the connecting superuser/owner, before any role switch). All writes roll
-- back at the end, even on the disposable local DB.
insert into auth.users (id) values
  ('84000000-0000-4000-8000-000000000001'), -- admin_actor
  ('84000000-0000-4000-8000-000000000002'), -- lecturer_a: assigned to course_a
  ('84000000-0000-4000-8000-000000000003'), -- lecturer_inactive
  ('84000000-0000-4000-8000-000000000004'), -- student_browser: for browse_available_slots
  ('84000000-0000-4000-8000-000000000005'), -- student_noncaller: non-admin direct-call actor
  ('84000000-0000-4000-8000-000000000006'), -- lecturer_noncaller: non-admin direct-call actor
  ('84000000-0000-4000-8000-000000000007'); -- booking_student: AC12's approved booking

update public.profiles set role = 'admin' where id = '84000000-0000-4000-8000-000000000001';
update public.profiles set role = 'lecturer'
  where id in ('84000000-0000-4000-8000-000000000002', '84000000-0000-4000-8000-000000000006');
update public.profiles set role = 'lecturer', is_active = false
  where id = '84000000-0000-4000-8000-000000000003';
-- 000004, 000005, 000007 stay the trigger's default role ('student'), active.

insert into public.courses (id, code, name, is_active) values
  ('85000000-0000-4000-8000-000000000001', 'ADM02A', 'ADM-02 Course A', true),
  ('85000000-0000-4000-8000-000000000002', 'ADM02B', 'ADM-02 Course B (inactive)', false);

-- Pre-existing active assignment: course_a <-> lecturer_a, for AC11's duplicate-conflict check
-- and AC12/AC13's removal/re-assignment flow.
insert into public.course_lecturers (id, course_id, lecturer_id, is_active) values
  ('86000000-0000-4000-8000-000000000001',
   '85000000-0000-4000-8000-000000000001', '84000000-0000-4000-8000-000000000002', true);

-- Two future slots on course_a/lecturer_a: one unbooked (AC6/AC7's browse-visibility subject),
-- one with an approved booking (AC12's removal/notification subject).
insert into public.consultation_slots (id, course_id, lecturer_id, starts_at, ends_at) values
  ('87000000-0000-4000-8000-000000000001',
   '85000000-0000-4000-8000-000000000001', '84000000-0000-4000-8000-000000000002',
   now() + interval '3 days', now() + interval '3 days 1 hour'),
  ('87000000-0000-4000-8000-000000000002',
   '85000000-0000-4000-8000-000000000001', '84000000-0000-4000-8000-000000000002',
   now() + interval '4 days', now() + interval '4 days 1 hour');
insert into public.bookings (id, slot_id, student_id, status, topic) values
  ('88000000-0000-4000-8000-000000000001',
   '87000000-0000-4000-8000-000000000002', '84000000-0000-4000-8000-000000000007',
   'approved', 'ADM-02 fixture booking');

-- ---------------------------------------------------------------------------
-- Acting as admin_actor.
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '84000000-0000-4000-8000-000000000001';
select is(public.current_app_role()::text, 'admin', 'fixture admin_actor identity validated');

-- [ADM-02-AC9] assigning to an inactive course is refused, no row created.
select is(
  public.admin_assign_lecturer(
    '85000000-0000-4000-8000-000000000002', '84000000-0000-4000-8000-000000000002'
  )->>'kind',
  'course_inactive',
  '[ADM-02-AC9] assigning a lecturer to an inactive course is refused'
);
reset role;
select is(
  (select count(*)::int from public.course_lecturers
    where course_id = '85000000-0000-4000-8000-000000000002'),
  0,
  '[ADM-02-AC9] no assignment row was created for the inactive course'
);
set local role authenticated;
set local request.jwt.claim.sub = '84000000-0000-4000-8000-000000000001';

-- [ADM-02-AC10] a deactivated lecturer and a student-role account are each refused.
select is(
  public.admin_assign_lecturer(
    '85000000-0000-4000-8000-000000000001', '84000000-0000-4000-8000-000000000003'
  )->>'kind',
  'lecturer_inactive',
  '[ADM-02-AC10] assigning a deactivated lecturer account is refused'
);
select is(
  public.admin_assign_lecturer(
    '85000000-0000-4000-8000-000000000001', '84000000-0000-4000-8000-000000000004'
  )->>'kind',
  'lecturer_wrong_role',
  '[ADM-02-AC10] assigning a student-role account is refused'
);
reset role;
select is(
  (select count(*)::int from public.course_lecturers
    where lecturer_id in
      ('84000000-0000-4000-8000-000000000003', '84000000-0000-4000-8000-000000000004')),
  0,
  '[ADM-02-AC10] neither refusal created an assignment row'
);
set local role authenticated;
set local request.jwt.claim.sub = '84000000-0000-4000-8000-000000000001';

-- [ADM-02-AC11] a duplicate active assignment for the same pair is refused; at most one
-- active row for that pair exists (sequential proxy for the concurrent-race half, same
-- limitation ADM-01-AC14 recorded: pgTAP cannot open two simultaneous transactions in one
-- session). The partial unique index itself -- the real concurrency authority -- is exercised
-- directly below, bypassing the RPC entirely.
select is(
  public.admin_assign_lecturer(
    '85000000-0000-4000-8000-000000000001', '84000000-0000-4000-8000-000000000002'
  )->>'kind',
  'conflict_duplicate_assignment',
  '[ADM-02-AC11] re-assigning an already-current pair is refused'
);
reset role;
select is(
  (select count(*)::int from public.course_lecturers
    where course_id = '85000000-0000-4000-8000-000000000001'
      and lecturer_id = '84000000-0000-4000-8000-000000000002'
      and is_active),
  1,
  '[ADM-02-AC11] exactly one active row exists for that pair'
);
select throws_ok(
  $$insert into public.course_lecturers (course_id, lecturer_id, is_active) values
    ('85000000-0000-4000-8000-000000000001', '84000000-0000-4000-8000-000000000002', true)$$,
  '23505',
  null,
  '[ADM-02-AC11] the partial unique index itself refuses a second active row for the pair, '
  || 'even bypassing the RPC -- the concurrency authority for a true concurrent race'
);
set local role authenticated;
set local request.jwt.claim.sub = '84000000-0000-4000-8000-000000000001';

-- [ADM-02-AC6] deactivating a course preserves every row but hides its unbooked slot from
-- browse.
select is(
  public.admin_set_course_active('85000000-0000-4000-8000-000000000001', false)->>'kind',
  'success',
  'admin_actor deactivates course_a'
);
reset role;
select is(
  (select is_active from public.courses where id = '85000000-0000-4000-8000-000000000001'),
  false,
  '[ADM-02-AC6] course row preserved, is_active now false'
);
select is(
  (select count(*)::int from public.consultation_slots
    where id = '87000000-0000-4000-8000-000000000001'),
  1,
  '[ADM-02-AC6] the unbooked slot row is preserved (not deleted) after course deactivation'
);
select is(
  (select count(*)::int from public.course_lecturers
    where id = '86000000-0000-4000-8000-000000000001'),
  1,
  '[ADM-02-AC6] the assignment row is preserved (not deleted) after course deactivation'
);
set local role authenticated;
set local request.jwt.claim.sub = '84000000-0000-4000-8000-000000000004'; -- student_browser
select is(
  (select public.browse_available_slots() -> 'slots') @> jsonb_build_array(
    jsonb_build_object('slotId', '87000000-0000-4000-8000-000000000001')
  ),
  false,
  '[ADM-02-AC6] the deactivated course''s unbooked future slot no longer appears in browse_available_slots'
);

-- [ADM-02-AC7] reactivating restores browse eligibility for that same slot.
set local request.jwt.claim.sub = '84000000-0000-4000-8000-000000000001';
select is(
  public.admin_set_course_active('85000000-0000-4000-8000-000000000001', true)->>'kind',
  'success',
  'admin_actor reactivates course_a'
);
set local request.jwt.claim.sub = '84000000-0000-4000-8000-000000000004';
select is(
  (select public.browse_available_slots() -> 'slots') @> jsonb_build_array(
    jsonb_build_object('slotId', '87000000-0000-4000-8000-000000000001')
  ),
  true,
  '[ADM-02-AC7] reactivation restores the unbooked slot''s visibility in browse_available_slots'
);
set local request.jwt.claim.sub = '84000000-0000-4000-8000-000000000001';

-- [ADM-02-AC12] removing an assignment with an approved booking ends it and notifies, leaving
-- the booking/slot unchanged.
select is(
  public.admin_remove_assignment('86000000-0000-4000-8000-000000000001')->>'kind',
  'success',
  'admin_actor removes the course_a/lecturer_a assignment'
);
reset role;
select is(
  (select row(is_active, ended_at is not null) from public.course_lecturers
    where id = '86000000-0000-4000-8000-000000000001'),
  row(false, true),
  '[ADM-02-AC12] the assignment is ended: is_active false, ended_at set'
);
select is(
  (select status::text from public.bookings where id = '88000000-0000-4000-8000-000000000001'),
  'approved',
  '[ADM-02-AC12] the approved booking is unchanged'
);
select is(
  (select count(*)::int from public.consultation_slots
    where id = '87000000-0000-4000-8000-000000000002'),
  1,
  '[ADM-02-AC12] the booked slot is unchanged (preserved)'
);
select is(
  (select count(*)::int from public.in_app_notifications
    where booking_id = '88000000-0000-4000-8000-000000000001'
      and recipient_id = '84000000-0000-4000-8000-000000000007' -- the booking's student
      and kind = 'consultation_deactivated'),
  1,
  '[ADM-02-AC12] the booking''s student received the existing deactivation notification'
);
select is(
  (select count(*)::int from public.in_app_notifications
    where booking_id = '88000000-0000-4000-8000-000000000001'
      and recipient_id = '84000000-0000-4000-8000-000000000002' -- lecturer_a
      and kind = 'consultation_deactivated'),
  1,
  '[ADM-02-AC12] the assigned lecturer received the existing deactivation notification'
);
select (ended_at) into temporary adm02_prior_ended_at
  from public.course_lecturers where id = '86000000-0000-4000-8000-000000000001';
set local role authenticated;
set local request.jwt.claim.sub = '84000000-0000-4000-8000-000000000001';

-- [ADM-02-AC13] re-assigning the same pair after removal inserts a new row rather than
-- reactivating the ended one; the prior row's ended_at is unchanged.
select is(
  public.admin_assign_lecturer(
    '85000000-0000-4000-8000-000000000001', '84000000-0000-4000-8000-000000000002'
  )->>'kind',
  'success',
  '[ADM-02-AC13] re-assigning the same pair after removal succeeds'
);
select is(
  public.admin_assign_lecturer(
    '85000000-0000-4000-8000-000000000001', '84000000-0000-4000-8000-000000000002'
  )->>'kind',
  'conflict_duplicate_assignment',
  'sanity: the pair is current again, so yet another assignment attempt conflicts'
);
reset role;
select is(
  (select count(*)::int from public.course_lecturers
    where course_id = '85000000-0000-4000-8000-000000000001'
      and lecturer_id = '84000000-0000-4000-8000-000000000002'),
  2,
  '[ADM-02-AC13] two distinct rows now exist for this pair: the ended one and the new one'
);
select is(
  (select row(is_active, ended_at is null) from public.course_lecturers
    where course_id = '85000000-0000-4000-8000-000000000001'
      and lecturer_id = '84000000-0000-4000-8000-000000000002'
      and id <> '86000000-0000-4000-8000-000000000001'),
  row(true, true),
  '[ADM-02-AC13] the new row is active with its own created_at/ended_at = null'
);
select is(
  (select ended_at from public.course_lecturers where id = '86000000-0000-4000-8000-000000000001'),
  (select ended_at from adm02_prior_ended_at),
  '[ADM-02-AC13] the prior (ended) row''s ended_at is unchanged by the re-assignment'
);
drop table adm02_prior_ended_at;

-- ---------------------------------------------------------------------------
-- [ADM-02-AC15] non-admin and signed-out direct callers are refused, with no mutation.
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '84000000-0000-4000-8000-000000000005'; -- student_noncaller
select is(
  public.admin_list_courses()->>'kind',
  'forbidden_or_not_found',
  '[ADM-02-AC15] a non-admin student caller is refused by admin_list_courses'
);
select is(
  public.admin_create_course('ADM02Z', 'Should never be created')->>'kind',
  'forbidden_or_not_found',
  '[ADM-02-AC15] a non-admin student caller is refused by admin_create_course'
);
set local request.jwt.claim.sub = '84000000-0000-4000-8000-000000000006'; -- lecturer_noncaller
select is(
  public.admin_assign_lecturer(
    '85000000-0000-4000-8000-000000000001', '84000000-0000-4000-8000-000000000006'
  )->>'kind',
  'forbidden_or_not_found',
  '[ADM-02-AC15] a non-admin lecturer caller is refused by admin_assign_lecturer'
);
reset role;
select is(
  (select count(*)::int from public.courses where upper(trim(code)) = 'ADM02Z'),
  0,
  '[ADM-02-AC15] no course was created by the refused non-admin attempt'
);
select is(
  (select count(*)::int from public.course_lecturers
    where lecturer_id = '84000000-0000-4000-8000-000000000006'),
  0,
  '[ADM-02-AC15] no assignment was created by the refused non-admin attempt'
);

-- anon has no execute grant at all: the call never reaches the function body.
set local role anon;
select throws_ok(
  $$select public.admin_list_courses()$$,
  '42501',
  null,
  '[ADM-02-AC15] signed-out (anon) direct RPC call to admin_list_courses is refused before execution'
);
select throws_ok(
  $$select public.admin_create_course('ADM02Y', 'Should never be created')$$,
  '42501',
  null,
  '[ADM-02-AC15] signed-out (anon) direct RPC call to admin_create_course is refused before execution'
);
select throws_ok(
  $$select public.admin_remove_assignment('86000000-0000-4000-8000-000000000001')$$,
  '42501',
  null,
  '[ADM-02-AC15] signed-out (anon) direct RPC call to admin_remove_assignment is refused before execution'
);
reset role;
select is(
  (select count(*)::int from public.courses where upper(trim(code)) = 'ADM02Y'),
  0,
  '[ADM-02-AC15] no course was created by the refused signed-out attempt'
);

select * from finish();
rollback;

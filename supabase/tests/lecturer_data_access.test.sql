-- LEC-01 "Data access path" and LEC-04-AC7: lecturer reads and writes go through role-checked
-- security definer functions, because STU-01 revokes every direct table privilege from
-- "authenticated". Fixture writes and raw checks run as the table owner after "reset role";
-- every function call runs as "authenticated" with a request.jwt.claim.sub, like ADM-02's tests.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select has_function('public', 'lecturer_list_my_courses', '[LEC-01-AC13] lecturer_list_my_courses exists');
select has_function('public', 'lecturer_list_my_slots', '[LEC-01-AC13] lecturer_list_my_slots exists');
select has_function('public', 'lecturer_create_slot', array['uuid', 'timestamp with time zone', 'timestamp with time zone'],
  '[LEC-01-AC13] lecturer_create_slot exists');
select has_function('public', 'lecturer_update_slot',
  array['uuid', 'uuid', 'timestamp with time zone', 'timestamp with time zone', 'boolean'],
  '[LEC-01-AC13] lecturer_update_slot exists');
select has_function('public', 'lecturer_delete_slot', array['uuid', 'boolean'],
  '[LEC-01-AC13] lecturer_delete_slot exists');
select has_function('public', 'lecturer_get_briefing_context', array['uuid'],
  '[LEC-04-AC7] lecturer_get_briefing_context exists');
select has_function('public', 'lecturer_save_briefing', array['uuid', 'text'],
  '[LEC-04-AC7] lecturer_save_briefing exists');

select ok(
  not has_table_privilege('authenticated', 'public.courses', 'select')
    and not has_table_privilege('authenticated', 'public.course_lecturers', 'select')
    and not has_table_privilege('authenticated', 'public.consultation_slots', 'select')
    and not has_table_privilege('authenticated', 'public.bookings', 'select'),
  '[LEC-01-AC13] authenticated still has no direct privilege on the four feature tables'
);

-- Fixtures.
insert into auth.users (id) values
  ('94000000-0000-4000-8000-000000000001'), -- lecturer_a
  ('94000000-0000-4000-8000-000000000002'), -- lecturer_b
  ('94000000-0000-4000-8000-000000000003'), -- student
  ('94000000-0000-4000-8000-000000000004'); -- lecturer_inactive
update public.profiles set role = 'lecturer', full_name = 'Lecturer A'
  where id = '94000000-0000-4000-8000-000000000001';
update public.profiles set role = 'lecturer', full_name = 'Lecturer B'
  where id = '94000000-0000-4000-8000-000000000002';
update public.profiles set full_name = 'Student S' where id = '94000000-0000-4000-8000-000000000003';
update public.profiles set role = 'lecturer', is_active = false
  where id = '94000000-0000-4000-8000-000000000004';

insert into public.courses (id, code, name, is_active) values
  ('95000000-0000-4000-8000-000000000001', 'LECA', 'Assigned course', true),
  ('95000000-0000-4000-8000-000000000002', 'LECB', 'Ended assignment course', true),
  ('95000000-0000-4000-8000-000000000003', 'LECC', 'Inactive course', true),
  ('95000000-0000-4000-8000-000000000004', 'LECD', 'Lecturer B course', true);
insert into public.course_lecturers (course_id, lecturer_id, is_active) values
  ('95000000-0000-4000-8000-000000000001', '94000000-0000-4000-8000-000000000001', true),
  ('95000000-0000-4000-8000-000000000003', '94000000-0000-4000-8000-000000000001', true),
  ('95000000-0000-4000-8000-000000000004', '94000000-0000-4000-8000-000000000002', true);
insert into public.course_lecturers (course_id, lecturer_id, is_active, ended_at) values
  ('95000000-0000-4000-8000-000000000002', '94000000-0000-4000-8000-000000000001', false, now());
update public.courses set is_active = false where id = '95000000-0000-4000-8000-000000000003';

insert into public.consultation_slots (id, course_id, lecturer_id, starts_at, ends_at) values
  ('96000000-0000-4000-8000-000000000001', '95000000-0000-4000-8000-000000000001',
   '94000000-0000-4000-8000-000000000001', now() + interval '2 days', now() + interval '2 days 30 minutes'),
  ('96000000-0000-4000-8000-000000000002', '95000000-0000-4000-8000-000000000001',
   '94000000-0000-4000-8000-000000000001', now() + interval '4 days', now() + interval '4 days 30 minutes'),
  ('96000000-0000-4000-8000-000000000003', '95000000-0000-4000-8000-000000000001',
   '94000000-0000-4000-8000-000000000001', now() - interval '2 days', now() - interval '2 days' + interval '30 minutes'),
  ('96000000-0000-4000-8000-000000000004', '95000000-0000-4000-8000-000000000004',
   '94000000-0000-4000-8000-000000000002', now() + interval '3 days', now() + interval '3 days 30 minutes');
insert into public.bookings (id, slot_id, student_id, status, topic, questions) values
  ('97000000-0000-4000-8000-000000000001', '96000000-0000-4000-8000-000000000001',
   '94000000-0000-4000-8000-000000000003', 'approved', 'Upcoming topic', 'Upcoming questions'),
  ('97000000-0000-4000-8000-000000000002', '96000000-0000-4000-8000-000000000002',
   '94000000-0000-4000-8000-000000000003', 'pending', 'Pending topic', 'Pending questions'),
  ('97000000-0000-4000-8000-000000000003', '96000000-0000-4000-8000-000000000003',
   '94000000-0000-4000-8000-000000000003', 'approved', 'Past topic', 'Past questions');

-- ---------------------------------------------------------------------------
-- Acting as lecturer_a.
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '94000000-0000-4000-8000-000000000001';

select results_eq(
  'select code from public.lecturer_list_my_courses()',
  array['LECA'],
  '[LEC-01-AC14] only active courses with an active assignment are offered'
);
select set_eq(
  'select id from public.lecturer_list_my_slots()',
  array['96000000-0000-4000-8000-000000000001', '96000000-0000-4000-8000-000000000002',
        '96000000-0000-4000-8000-000000000003']::uuid[],
  '[LEC-01-AC3] [LEC-01-AC13] the slot list contains only the caller''s own slots'
);

create temporary table created_slot (result jsonb) on commit drop;
grant all on created_slot to authenticated;
insert into created_slot select public.lecturer_create_slot(
  '95000000-0000-4000-8000-000000000001', now() + interval '6 days', now() + interval '6 days 30 minutes');
select is((select result->>'kind' from created_slot), 'ok',
  '[LEC-01-AC1] [LEC-01-AC13] an assigned lecturer creates a slot');

select is(public.lecturer_create_slot('95000000-0000-4000-8000-000000000001',
  now() + interval '6 days 10 minutes', now() + interval '6 days 40 minutes')->>'kind', 'overlap',
  '[LEC-01-AC8] an overlapping slot is refused');
select is(public.lecturer_create_slot('95000000-0000-4000-8000-000000000002',
  now() + interval '8 days', now() + interval '8 days 30 minutes')->>'kind', 'not_assigned',
  '[LEC-01-AC14] a course whose assignment ended is refused');
select is(public.lecturer_create_slot('95000000-0000-4000-8000-000000000003',
  now() + interval '8 days', now() + interval '8 days 30 minutes')->>'kind', 'not_assigned',
  '[LEC-01-AC14] an inactive course is refused');
select is(public.lecturer_create_slot('95000000-0000-4000-8000-000000000004',
  now() + interval '8 days', now() + interval '8 days 30 minutes')->>'kind', 'not_assigned',
  '[LEC-01-AC6] another lecturer''s course is refused');
select is(public.lecturer_create_slot('95000000-0000-4000-8000-000000000001',
  now() + interval '30 minutes', now() + interval '1 hour')->>'kind', 'too_soon',
  '[LEC-01-AC9] a slot starting within one hour is refused');
select is(public.lecturer_create_slot('95000000-0000-4000-8000-000000000001',
  now() + interval '9 days', now() + interval '9 days')->>'kind', 'validation_error',
  '[LEC-01-AC9] a slot that does not end after it starts is refused');

select is(public.lecturer_update_slot('96000000-0000-4000-8000-000000000004',
  '95000000-0000-4000-8000-000000000001', now() + interval '10 days', now() + interval '10 days 30 minutes',
  true)->>'kind', 'not_found',
  '[LEC-01-AC6] another lecturer''s slot cannot be edited');
select is(public.lecturer_update_slot('96000000-0000-4000-8000-000000000002',
  '95000000-0000-4000-8000-000000000001', now() + interval '10 days', now() + interval '10 days 30 minutes',
  false)->>'kind', 'confirmation_required',
  '[LEC-01-AC7] editing a slot with an active booking needs confirmation');
select is(public.lecturer_delete_slot('96000000-0000-4000-8000-000000000002', false)->>'kind',
  'confirmation_required',
  '[LEC-01-AC7] deleting a slot with an active booking needs confirmation');
select is(public.lecturer_delete_slot('96000000-0000-4000-8000-000000000004', true)->>'kind',
  'not_found', '[LEC-01-AC6] another lecturer''s slot cannot be deleted');
select is(public.lecturer_delete_slot((select (result->>'id')::uuid from created_slot), false)->>'kind',
  'ok', '[LEC-01-AC5] an unbooked own slot is deleted');

select is(public.lecturer_get_briefing_context('97000000-0000-4000-8000-000000000001')->>'kind', 'ok',
  '[LEC-04-AC7] an approved upcoming own consultation can be briefed');
select is(public.lecturer_get_briefing_context('97000000-0000-4000-8000-000000000001')->>'studentName',
  'Student S', '[LEC-04-AC7] the briefing context carries the student name');
select is(public.lecturer_get_briefing_context('97000000-0000-4000-8000-000000000001')->>'topic',
  'Upcoming topic', '[LEC-04-AC7] the briefing context carries the topic');
select ok(public.lecturer_get_briefing_context('97000000-0000-4000-8000-000000000001') ? 'studentEmail' = false,
  '[LEC-04-AC7] the briefing context never carries the student email');
select is(public.lecturer_get_briefing_context('97000000-0000-4000-8000-000000000003')->>'kind',
  'not_upcoming', '[LEC-04-AC7] a past consultation is refused');
select is(public.lecturer_get_briefing_context('97000000-0000-4000-8000-000000000002')->>'kind',
  'not_found', '[LEC-04-AC7] a pending booking is refused');
select is(public.lecturer_save_briefing('97000000-0000-4000-8000-000000000001',
  'Summary\nGrouped question themes\nPreparation topics')->>'kind', 'ok',
  '[LEC-04-AC7] a briefing for an own approved consultation is saved');
select is(public.lecturer_save_briefing('97000000-0000-4000-8000-000000000002', 'Summary')->>'kind',
  'not_found', '[LEC-04-AC7] a briefing for a pending booking is refused');
select is(public.lecturer_save_briefing('97000000-0000-4000-8000-000000000001', repeat('x', 12001))->>'kind',
  'validation_error', '[LEC-04-AC7] a briefing over 12,000 characters is refused');
reset role;
select is((select count(*)::int from public.lecturer_ai_briefings
    where booking_id = '97000000-0000-4000-8000-000000000001'), 1,
  '[LEC-04-AC7] exactly one briefing row was saved');

select is(
  (select count(*)::int from public.consultation_slots where id = '96000000-0000-4000-8000-000000000002'),
  1, '[LEC-01-AC7] the booked slot was not deleted without confirmation');
select ok(
  exists (select 1 from public.consultation_audit_log
    where actor_id = '94000000-0000-4000-8000-000000000001' and action = 'created' and outcome = 'success'),
  '[LEC-01-AC13] the create was audited in the same transaction');

-- ---------------------------------------------------------------------------
-- Acting as lecturer_b, then the student, then the inactive lecturer.
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '94000000-0000-4000-8000-000000000002';
select is(public.lecturer_get_briefing_context('97000000-0000-4000-8000-000000000001')->>'kind',
  'not_found', '[LEC-04-AC7] another lecturer''s consultation is not disclosed');
select is(public.lecturer_save_briefing('97000000-0000-4000-8000-000000000001', 'Summary')->>'kind',
  'not_found', '[LEC-04-AC7] another lecturer cannot save a briefing for it');

set local request.jwt.claim.sub = '94000000-0000-4000-8000-000000000003';
select is((select count(*)::int from public.lecturer_list_my_courses()), 0,
  '[LEC-01-AC13] a student gets no courses');
select is((select count(*)::int from public.lecturer_list_my_slots()), 0,
  '[LEC-01-AC13] a student gets no slots');
select is(public.lecturer_create_slot('95000000-0000-4000-8000-000000000001',
  now() + interval '12 days', now() + interval '12 days 30 minutes')->>'kind', 'forbidden_or_not_found',
  '[LEC-01-AC2] [LEC-01-AC13] a student cannot create a slot');
select is(public.lecturer_delete_slot('96000000-0000-4000-8000-000000000001', true)->>'kind',
  'forbidden_or_not_found', '[LEC-01-AC2] a student cannot delete a slot');
select is(public.lecturer_get_briefing_context('97000000-0000-4000-8000-000000000001')->>'kind',
  'forbidden_or_not_found', '[LEC-04-AC7] a student cannot read briefing context');

set local request.jwt.claim.sub = '94000000-0000-4000-8000-000000000004';
select is(public.lecturer_create_slot('95000000-0000-4000-8000-000000000001',
  now() + interval '12 days', now() + interval '12 days 30 minutes')->>'kind', 'forbidden_or_not_found',
  '[LEC-01-AC2] an inactive lecturer cannot create a slot');
reset role;

select is(
  (select count(*)::int from public.consultation_slots
    where lecturer_id in ('94000000-0000-4000-8000-000000000003', '94000000-0000-4000-8000-000000000004')),
  0, '[LEC-01-AC2] refused callers created no slot');

select * from finish();
rollback;

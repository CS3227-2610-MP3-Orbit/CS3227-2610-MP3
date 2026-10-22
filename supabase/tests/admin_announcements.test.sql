-- ADM-03 database-layer verification: the three admin_* announcement RPCs exist, the table
-- privilege boundary (ADM-03-R6/AC10: insert/update/delete revoked from anon/authenticated,
-- execute granted only to authenticated), and the two RLS select policies (ADM-03-R4/R5/AC7)
-- directly, independent of the vitest integration suite's real-REST coverage. Mirrors ADM-02's
-- admin_courses.test.sql and ADM-04's admin_booking_reports.test.sql in structure,
-- fixture-isolation, and role-switching style.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select has_function('public', 'admin_create_announcement', array['text', 'text', 'text'],
  '[ADM-03-R1] [ADM-03-R6] admin_create_announcement RPC exists');
select has_function(
  'public', 'admin_update_announcement', array['uuid', 'text', 'text', 'text'],
  '[ADM-03-R2] [ADM-03-R6] admin_update_announcement RPC exists'
);
select has_function(
  'public', 'admin_set_announcement_published', array['uuid', 'boolean'],
  '[ADM-03-R3] [ADM-03-R6] admin_set_announcement_published RPC exists'
);

-- ---------------------------------------------------------------------------
-- [ADM-03-AC10] insert/update/delete privilege: neither anon nor authenticated holds it, and
-- every admin_* function's execute privilege is granted only to authenticated.
-- ---------------------------------------------------------------------------
select ok(
  not has_table_privilege('authenticated', 'public.announcements', 'insert'),
  '[ADM-03-AC10] authenticated has no insert privilege on announcements'
);
select ok(
  not has_table_privilege('authenticated', 'public.announcements', 'update'),
  '[ADM-03-AC10] authenticated has no update privilege on announcements'
);
select ok(
  not has_table_privilege('authenticated', 'public.announcements', 'delete'),
  '[ADM-03-AC10] authenticated has no delete privilege on announcements'
);
select ok(
  not has_table_privilege('anon', 'public.announcements', 'insert'),
  '[ADM-03-AC10] anon has no insert privilege on announcements'
);
select ok(
  not has_table_privilege('anon', 'public.announcements', 'update'),
  '[ADM-03-AC10] anon has no update privilege on announcements'
);
select ok(
  not has_table_privilege('anon', 'public.announcements', 'delete'),
  '[ADM-03-AC10] anon has no delete privilege on announcements'
);
select ok(
  not has_table_privilege('anon', 'public.announcements', 'select'),
  '[ADM-03-AC10] anon has no select privilege on announcements either (defense in depth beyond RLS)'
);
select ok(
  has_table_privilege('authenticated', 'public.announcements', 'select'),
  '[ADM-03-R4] [ADM-03-R5] authenticated DOES have select (the two RLS policies govern which rows)'
);

select ok(
  has_function_privilege(
    'authenticated', 'public.admin_create_announcement(text, text, text)', 'execute'
  ),
  '[ADM-03-AC10] authenticated holds execute on admin_create_announcement'
);
select ok(
  not has_function_privilege(
    'anon', 'public.admin_create_announcement(text, text, text)', 'execute'
  ),
  '[ADM-03-AC10] anon does not hold execute on admin_create_announcement'
);
select ok(
  not has_function_privilege(
    'anon', 'public.admin_update_announcement(uuid, text, text, text)', 'execute'
  ),
  '[ADM-03-AC10] anon does not hold execute on admin_update_announcement'
);
select ok(
  not has_function_privilege(
    'anon', 'public.admin_set_announcement_published(uuid, boolean)', 'execute'
  ),
  '[ADM-03-AC10] anon does not hold execute on admin_set_announcement_published'
);

-- Fixtures (run as the connecting superuser/owner, before any role switch). All writes roll
-- back at the end, even on the disposable local DB.
insert into auth.users (id) values
  ('8a000000-0000-4000-8000-000000000001'), -- admin_actor
  ('8a000000-0000-4000-8000-000000000002'), -- lecturer_noncaller
  ('8a000000-0000-4000-8000-000000000003'), -- student_noncaller
  ('8a000000-0000-4000-8000-000000000004'); -- deactivated_student

update public.profiles set role = 'admin' where id = '8a000000-0000-4000-8000-000000000001';
update public.profiles set role = 'lecturer' where id = '8a000000-0000-4000-8000-000000000002';
update public.profiles set role = 'student', is_active = false
  where id = '8a000000-0000-4000-8000-000000000004';
-- 000003 stays the trigger's default role ('student'), active.

insert into public.announcements
  (id, kind, title, body, is_published, created_by, updated_by) values
  ('8b000000-0000-4000-8000-000000000001', 'guideline', 'ADM-03 draft', 'Draft body.', false,
   '8a000000-0000-4000-8000-000000000001', '8a000000-0000-4000-8000-000000000001'),
  ('8b000000-0000-4000-8000-000000000002', 'announcement', 'ADM-03 published', 'Published body.',
   true, '8a000000-0000-4000-8000-000000000001', '8a000000-0000-4000-8000-000000000001');

-- ---------------------------------------------------------------------------
-- [ADM-03-AC7] a draft item is invisible to a non-admin (direct select, bypassing RLS-aware
-- app code entirely), and to a deactivated user, even for an item that is published.
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '8a000000-0000-4000-8000-000000000002'; -- lecturer_noncaller
select is(
  (select count(*)::int from public.announcements
    where id = '8b000000-0000-4000-8000-000000000001'),
  0,
  '[ADM-03-AC7] a lecturer''s direct select against the draft row returns no row'
);
select is(
  (select count(*)::int from public.announcements
    where id = '8b000000-0000-4000-8000-000000000002'),
  1,
  'sanity: the same lecturer DOES see the published row'
);

set local request.jwt.claim.sub = '8a000000-0000-4000-8000-000000000003'; -- student_noncaller
select is(
  (select count(*)::int from public.announcements
    where id = '8b000000-0000-4000-8000-000000000001'),
  0,
  '[ADM-03-AC7] a student''s direct select against the draft row returns no row'
);

-- [ADM-03-AC15] a deactivated user's direct select sees nothing at all, published or not.
set local request.jwt.claim.sub = '8a000000-0000-4000-8000-000000000004'; -- deactivated_student
select is(
  (select count(*)::int from public.announcements
    where id in
      ('8b000000-0000-4000-8000-000000000001', '8b000000-0000-4000-8000-000000000002')),
  0,
  '[ADM-03-AC15] a deactivated user''s direct select returns no row, published or draft'
);

-- [ADM-03-R4] the admin sees every row, published and draft alike.
set local request.jwt.claim.sub = '8a000000-0000-4000-8000-000000000001'; -- admin_actor
select is(
  (select count(*)::int from public.announcements
    where id in
      ('8b000000-0000-4000-8000-000000000001', '8b000000-0000-4000-8000-000000000002')),
  2,
  '[ADM-03-R4] the admin''s direct select sees both the draft and the published row'
);

-- ---------------------------------------------------------------------------
-- [ADM-03-AC9] non-admin and signed-out direct RPC callers are refused, with no mutation.
-- ---------------------------------------------------------------------------
set local request.jwt.claim.sub = '8a000000-0000-4000-8000-000000000003'; -- student_noncaller
select is(
  public.admin_create_announcement('guideline', 'Should never be created', 'Body')->>'kind',
  'forbidden_or_not_found',
  '[ADM-03-AC9] a non-admin student caller is refused by admin_create_announcement'
);
set local request.jwt.claim.sub = '8a000000-0000-4000-8000-000000000002'; -- lecturer_noncaller
select is(
  public.admin_update_announcement(
    '8b000000-0000-4000-8000-000000000002', 'guideline', 'x', 'y'
  )->>'kind',
  'forbidden_or_not_found',
  '[ADM-03-AC9] a non-admin lecturer caller is refused by admin_update_announcement'
);
select is(
  public.admin_set_announcement_published(
    '8b000000-0000-4000-8000-000000000002', false
  )->>'kind',
  'forbidden_or_not_found',
  '[ADM-03-AC9] a non-admin lecturer caller is refused by admin_set_announcement_published'
);
reset role;
select is(
  (select count(*)::int from public.announcements where title = 'Should never be created'),
  0,
  '[ADM-03-AC9] no row was created by the refused non-admin attempt'
);
select is(
  (select is_published from public.announcements
    where id = '8b000000-0000-4000-8000-000000000002'),
  true,
  '[ADM-03-AC9] the refused unpublish attempt left the published row unchanged'
);

-- anon has no execute grant at all: the call never reaches the function body.
set local role anon;
select throws_ok(
  $$select public.admin_create_announcement('guideline', 'Should never be created', 'Body')$$,
  '42501',
  null,
  '[ADM-03-AC9] signed-out (anon) direct RPC call to admin_create_announcement is refused before execution'
);
select throws_ok(
  $$select public.admin_set_announcement_published(
    '8b000000-0000-4000-8000-000000000002', false
  )$$,
  '42501',
  null,
  '[ADM-03-AC9] signed-out (anon) direct RPC call to admin_set_announcement_published is refused before execution'
);
reset role;
select is(
  (select count(*)::int from public.announcements where title = 'Should never be created'),
  0,
  '[ADM-03-AC9] no row was created by the refused signed-out attempt'
);

-- ---------------------------------------------------------------------------
-- [ADM-03-AC5] no delete path exists anywhere: unpublishing preserves the row.
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '8a000000-0000-4000-8000-000000000001'; -- admin_actor
select is(
  public.admin_set_announcement_published(
    '8b000000-0000-4000-8000-000000000002', false
  )->>'kind',
  'success',
  'admin_actor unpublishes the previously-published row'
);
reset role;
select is(
  (select row(is_published, created_by) from public.announcements
    where id = '8b000000-0000-4000-8000-000000000002'),
  row(false, '8a000000-0000-4000-8000-000000000001'::uuid),
  '[ADM-03-AC5] the row is preserved (not deleted): is_published now false, created_by unchanged'
);

select * from finish();
rollback;

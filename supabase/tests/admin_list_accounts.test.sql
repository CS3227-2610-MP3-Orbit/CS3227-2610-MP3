-- ADM-01-R2 database-layer verification: admin_list_accounts (list/search).
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select has_function('public', 'admin_list_accounts', array['text', 'app_role', 'boolean'],
  '[ADM-01-AC4] admin_list_accounts RPC exists');

-- Fixtures. All writes roll back at the end. Distinct email per fixture so search-by-email
-- and search-by-full-name can be tested independently of the shared seed data.
insert into auth.users (id, email) values
  ('84000000-0000-4000-8000-000000000001', 'adm-list-admin@example.test'),      -- caller
  ('84000000-0000-4000-8000-000000000002', 'adm-list-alpha@example.test'),      -- target_a
  ('84000000-0000-4000-8000-000000000003', 'adm-list-beta@example.test'),       -- target_b
  ('84000000-0000-4000-8000-000000000004', 'adm-list-nonadmin@example.test');   -- non-admin caller

update public.profiles set role = 'admin'
  where id = '84000000-0000-4000-8000-000000000001';
update public.profiles set role = 'lecturer', full_name = 'Alpha Target'
  where id = '84000000-0000-4000-8000-000000000002';
update public.profiles set role = 'student', full_name = 'Beta Target', is_active = false
  where id = '84000000-0000-4000-8000-000000000003';
-- non-admin caller (84...04) stays the trigger default: student, active, empty full_name.

set local role authenticated;
set local request.jwt.claim.sub = '84000000-0000-4000-8000-000000000001';
select is(public.current_app_role()::text, 'admin', 'fixture caller is an active admin');

-- [ADM-01-AC4] unfiltered list returns only the allowlisted fields, no password/secret.
select is(
  (
    select jsonb_agg(elem order by elem ->> 'id')
    from jsonb_array_elements(public.admin_list_accounts() -> 'accounts') as elem
    where elem ->> 'id' in (
      '84000000-0000-4000-8000-000000000001',
      '84000000-0000-4000-8000-000000000002',
      '84000000-0000-4000-8000-000000000003',
      '84000000-0000-4000-8000-000000000004'
    )
  ),
  jsonb_build_array(
    jsonb_build_object(
      'id', '84000000-0000-4000-8000-000000000001', 'email', 'adm-list-admin@example.test',
      'fullName', '', 'role', 'admin', 'isActive', true, 'isProtected', false
    ),
    jsonb_build_object(
      'id', '84000000-0000-4000-8000-000000000002', 'email', 'adm-list-alpha@example.test',
      'fullName', 'Alpha Target', 'role', 'lecturer', 'isActive', true, 'isProtected', false
    ),
    jsonb_build_object(
      'id', '84000000-0000-4000-8000-000000000003', 'email', 'adm-list-beta@example.test',
      'fullName', 'Beta Target', 'role', 'student', 'isActive', false, 'isProtected', false
    ),
    jsonb_build_object(
      'id', '84000000-0000-4000-8000-000000000004', 'email', 'adm-list-nonadmin@example.test',
      'fullName', '', 'role', 'student', 'isActive', true, 'isProtected', false
    )
  ),
  '[ADM-01-AC4] list returns exactly {id,email,fullName,role,isActive,isProtected} per account'
);
select ok(
  not (public.admin_list_accounts()::text ilike '%password%'),
  '[ADM-01-AC4] [ADM-01-AC12] response never contains a password/secret field'
);

-- [ADM-01-AC4] search by email substring.
select is(
  (select jsonb_agg(elem ->> 'id') from jsonb_array_elements(
    public.admin_list_accounts(p_query := 'adm-list-alpha') -> 'accounts'
  ) as elem),
  jsonb_build_array('84000000-0000-4000-8000-000000000002'),
  '[ADM-01-AC4] search by email substring finds only the matching account'
);

-- [ADM-01-AC4] search by full name substring.
select is(
  (select jsonb_agg(elem ->> 'id') from jsonb_array_elements(
    public.admin_list_accounts(p_query := 'Beta') -> 'accounts'
  ) as elem),
  jsonb_build_array('84000000-0000-4000-8000-000000000003'),
  '[ADM-01-AC4] search by full name substring finds only the matching account'
);

-- [ADM-01-AC4] role filter.
select ok(
  (select bool_and(elem ->> 'role' = 'lecturer') from jsonb_array_elements(
    public.admin_list_accounts(p_role := 'lecturer'::public.app_role) -> 'accounts'
  ) as elem),
  '[ADM-01-AC4] role filter returns only accounts with that role'
);

-- [ADM-01-AC4] active filter.
select is(
  (select jsonb_agg(elem ->> 'id') from jsonb_array_elements(
    public.admin_list_accounts(p_query := 'adm-list', p_active := false) -> 'accounts'
  ) as elem),
  jsonb_build_array('84000000-0000-4000-8000-000000000003'),
  '[ADM-01-AC4] active filter combines with the query filter'
);

-- Non-admin and signed-out callers get the same refusal as any other admin-only path,
-- with no account data returned.
set local request.jwt.claim.sub = '84000000-0000-4000-8000-000000000004';
select is(
  public.admin_list_accounts()->>'kind',
  'forbidden_or_not_found',
  '[ADM-01-AC4] [ADM-01-AC10] non-admin caller is refused, no account data'
);
reset role;

set local role anon;
select throws_ok(
  $$select public.admin_list_accounts()$$,
  '42501',
  null,
  '[ADM-01-AC4] [ADM-01-AC10] signed-out (anon) direct RPC call is refused before execution'
);
reset role;

select * from finish();
rollback;

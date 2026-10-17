-- [SH-01-AC4] A new sign-up is always a student, even if its metadata asks for another role.
begin;

create extension if not exists pgtap with schema extensions;

select plan(1);

insert into auth.users (id, email, raw_user_meta_data)
values (
  '00000000-0000-0000-0000-0000000000e1',
  'eve@example.com',
  '{"full_name": "Eve", "role": "admin"}'
);

select is(
  (select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000e1'),
  'student',
  'sign-up metadata cannot choose the role'
);

select * from finish();

rollback;

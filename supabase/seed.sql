-- Local development seed data. Applied by `npx supabase db reset`; never pushed to dev or prod.

-- Stable demo data for the Student request flow. This local-only account is for
-- browsing the seeded slot; do not reuse these credentials outside local development.
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   confirmation_token, recovery_token, email_change_token_new, email_change, raw_app_meta_data,
   raw_user_meta_data, created_at, updated_at, is_super_admin, is_sso_user, is_anonymous)
values
  ('00000000-0000-0000-0000-000000000000',
   '10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'demo-lecturer@localhost.test', crypt('LocalOnly!123', gen_salt('bf')), now(),
   '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now(),
   false, false, false)
on conflict (id) do nothing;

insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   confirmation_token, recovery_token, email_change_token_new, email_change, raw_app_meta_data,
   raw_user_meta_data, created_at, updated_at, is_super_admin, is_sso_user, is_anonymous)
values
  ('00000000-0000-0000-0000-000000000000',
   '11000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'demo-student@localhost.test', crypt('LocalOnly!123', gen_salt('bf')), now(),
   '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now(),
   false, false, false)
on conflict (id) do nothing;

insert into public.profiles (id, full_name, role, is_active)
values ('11000000-0000-4000-8000-000000000001', 'Demo Student', 'student', true)
on conflict (id) do update set full_name = excluded.full_name, role = excluded.role, is_active = true;

-- The auth trigger creates the profile; keep it as an active lecturer for the demo slot.
insert into public.profiles (id, full_name, role, is_active)
values ('10000000-0000-4000-8000-000000000001', 'Demo Lecturer', 'lecturer', true)
on conflict (id) do update set full_name = excluded.full_name, role = excluded.role, is_active = true;

insert into public.courses (id, code, name, is_active)
values ('20000000-0000-4000-8000-000000000001', 'CS3227', 'Software Engineering', true)
on conflict (id) do update set code = excluded.code, name = excluded.name, is_active = true;

insert into public.course_lecturers (id, course_id, lecturer_id, is_active, ended_at)
values (
  '30000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  true,
  null
)
on conflict (id) do update set is_active = true, ended_at = null;

insert into public.consultation_slots
  (id, course_id, lecturer_id, starts_at, ends_at)
values (
  '40000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  now() + interval '2 days',
  now() + interval '2 days 1 hour'
)
on conflict (id) do update set starts_at = now() + interval '2 days', ends_at = now() + interval '2 days 1 hour';

-- ADM-01: two local-only administrators. The migration marks the protected recovery
-- administrator before this seed runs, so the first demo administrator is marked here.
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   confirmation_token, recovery_token, email_change_token_new, email_change, raw_app_meta_data,
   raw_user_meta_data, created_at, updated_at, is_super_admin, is_sso_user, is_anonymous)
values
  ('00000000-0000-0000-0000-000000000000',
   '12000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'demo-admin@localhost.test', crypt('LocalOnly!123', gen_salt('bf')), now(),
   '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now(),
   false, false, false),
  ('00000000-0000-0000-0000-000000000000',
   '12000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
   'demo-admin2@localhost.test', crypt('LocalOnly!123', gen_salt('bf')), now(),
   '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now(),
   false, false, false)
on conflict (id) do nothing;

insert into public.profiles (id, full_name, role, is_active, is_protected)
values
  ('12000000-0000-4000-8000-000000000001', 'Demo Admin (protected)', 'admin', true, true),
  ('12000000-0000-4000-8000-000000000002', 'Demo Admin Two', 'admin', true, false)
on conflict (id) do update set full_name = excluded.full_name, role = excluded.role,
  is_active = true, is_protected = excluded.is_protected;

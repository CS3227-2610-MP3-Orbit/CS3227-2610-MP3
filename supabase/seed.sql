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
   '12000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'demo-student-two@localhost.test', crypt('LocalOnly!123', gen_salt('bf')), now(),
   '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now(),
   false, false, false),
  ('00000000-0000-0000-0000-000000000000',
   '13000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'demo-student-three@localhost.test', crypt('LocalOnly!123', gen_salt('bf')), now(),
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

insert into public.profiles (id, full_name, role, is_active)
values
  ('12000000-0000-4000-8000-000000000001', 'Demo Student Two', 'student', true),
  ('13000000-0000-4000-8000-000000000001', 'Demo Student Three', 'student', true)
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

insert into public.consultation_slots
  (id, course_id, lecturer_id, starts_at, ends_at)
values
  ('40000000-0000-4000-8000-000000000002',
   '20000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001',
   now() + interval '3 days', now() + interval '3 days 1 hour'),
  ('40000000-0000-4000-8000-000000000003',
   '20000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001',
   now() + interval '4 days', now() + interval '4 days 1 hour')
on conflict (id) do update set starts_at = excluded.starts_at, ends_at = excluded.ends_at;

insert into public.bookings
  (id, slot_id, student_id, status, topic, questions, rejection_reason)
values
  ('50000000-0000-4000-8000-000000000001',
   '40000000-0000-4000-8000-000000000001',
   '11000000-0000-4000-8000-000000000001',
   'approved',
   'Understanding database transactions',
   'How should transactions handle concurrent updates?',
   null),
  ('50000000-0000-4000-8000-000000000002',
   '40000000-0000-4000-8000-000000000002',
   '12000000-0000-4000-8000-000000000001',
   'pending',
   'Clarifying API design',
   'Could you explain the recommended API layering?',
   null),
  ('50000000-0000-4000-8000-000000000003',
   '40000000-0000-4000-8000-000000000003',
   '13000000-0000-4000-8000-000000000001',
   'rejected',
   'Testing strategy discussion',
   'Which tests should be prioritised first?',
   'The lecturer is unavailable for this time slot')
on conflict (id) do update set
  status = excluded.status,
  topic = excluded.topic,
  questions = excluded.questions,
  rejection_reason = excluded.rejection_reason;

-- ADM-01: local-only administrator accounts for the admin workflow.
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   confirmation_token, recovery_token, email_change_token_new, email_change, raw_app_meta_data,
   raw_user_meta_data, created_at, updated_at, is_super_admin, is_sso_user, is_anonymous)
values
  ('00000000-0000-0000-0000-000000000000',
   '14000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'demo-admin@localhost.test', crypt('LocalOnly!123', gen_salt('bf')), now(),
   '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now(),
   false, false, false),
  ('00000000-0000-0000-0000-000000000000',
   '14000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
   'demo-admin2@localhost.test', crypt('LocalOnly!123', gen_salt('bf')), now(),
   '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now(),
   false, false, false)
on conflict (id) do nothing;

insert into public.profiles (id, full_name, role, is_active, is_protected)
values
  ('14000000-0000-4000-8000-000000000001', 'Demo Admin (protected)', 'admin', true, true),
  ('14000000-0000-4000-8000-000000000002', 'Demo Admin Two', 'admin', true, false)
on conflict (id) do update set full_name = excluded.full_name, role = excluded.role,
  is_active = true, is_protected = excluded.is_protected;

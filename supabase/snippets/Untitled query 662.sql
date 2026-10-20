insert into public.consultation_slots (
  course_id,
  lecturer_id,
  starts_at,
  ends_at
)
values (
  '20000000-0000-4000-8000-000000000001', -- CS3227
  '10000000-0000-4000-8000-000000000001', -- Demo Lecturer
  now() + interval '3 days',
  now() + interval '3 days 1 hour'
);
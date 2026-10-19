-- LEC-01: lecturer consultation availability.
-- Singapore-local input is converted to timestamptz by the application.

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.course_lecturers (
  course_id uuid not null references public.courses(id) on delete cascade,
  lecturer_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (course_id, lecturer_id)
);

create table public.consultation_slots (
  id uuid primary key default gen_random_uuid(),
  lecturer_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint consultation_slots_positive_interval check (starts_at < ends_at),
  unique (lecturer_id, course_id, starts_at, ends_at)
);

create table public.consultation_bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.consultation_slots(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'booked' check (status in ('booked', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index consultation_bookings_one_live_per_student
  on public.consultation_bookings (slot_id, student_id) where status = 'booked';
create index consultation_slots_lecturer_start_idx on public.consultation_slots (lecturer_id, starts_at);
create index consultation_bookings_slot_status_idx on public.consultation_bookings (slot_id, status);

create table public.consultation_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  slot_id uuid,
  kind text not null check (kind in ('slot_updated', 'slot_deleted')),
  message text not null,
  created_at timestamptz not null default now()
);

create table public.consultation_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid not null references public.profiles(id),
  slot_id uuid,
  action text not null check (action in ('created', 'updated', 'deleted')),
  outcome text not null check (outcome in ('success', 'failure')),
  created_at timestamptz not null default now()
);

create or replace function public.touch_consultation_slot()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
create trigger consultation_slots_touch before update on public.consultation_slots
for each row execute function public.touch_consultation_slot();

alter table public.courses enable row level security;
alter table public.course_lecturers enable row level security;
alter table public.consultation_slots enable row level security;
alter table public.consultation_bookings enable row level security;
alter table public.consultation_notifications enable row level security;
alter table public.consultation_audit_log enable row level security;

create policy "course members read courses" on public.courses for select to authenticated
using (exists (select 1 from public.course_lecturers cl where cl.course_id = id and cl.lecturer_id = (select auth.uid()))
  or (select public.current_app_role()) = 'admin');
create policy "course members read assignments" on public.course_lecturers for select to authenticated
using (lecturer_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');

create policy "lecturers read own slots" on public.consultation_slots for select to authenticated
using (lecturer_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');
create policy "lecturers create own slots" on public.consultation_slots for insert to authenticated
with check (lecturer_id = (select auth.uid()) and (select public.current_app_role()) = 'lecturer');
create policy "lecturers update own slots" on public.consultation_slots for update to authenticated
using (lecturer_id = (select auth.uid()) or (select public.current_app_role()) = 'admin')
with check (lecturer_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');
create policy "lecturers delete own slots" on public.consultation_slots for delete to authenticated
using (lecturer_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');

create policy "booking owners read bookings" on public.consultation_bookings for select to authenticated
using (student_id = (select auth.uid()) or exists (select 1 from public.consultation_slots s where s.id = slot_id and s.lecturer_id = (select auth.uid())) or (select public.current_app_role()) = 'admin');
create policy "recipients read notifications" on public.consultation_notifications for select to authenticated
using (recipient_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');
create policy "admins read audit" on public.consultation_audit_log for select to authenticated
using ((select public.current_app_role()) = 'admin');

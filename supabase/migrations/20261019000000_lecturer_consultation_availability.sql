-- LEC-01: Lecturer consultation availability.
-- Shared Student migrations already provide courses, assignments, slots, and bookings.

create table public.consultation_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  slot_id uuid references public.consultation_slots(id) on delete set null,
  kind text not null check (kind in ('slot_updated', 'slot_deleted')),
  message text not null,
  created_at timestamptz not null default now()
);

create table public.consultation_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid not null references public.profiles(id),
  slot_id uuid references public.consultation_slots(id) on delete set null,
  action text not null check (action in ('created', 'updated', 'deleted')),
  outcome text not null check (outcome in ('success', 'failure')),
  created_at timestamptz not null default now()
);

alter table public.consultation_notifications enable row level security;
alter table public.consultation_audit_log enable row level security;

create policy "lecturers read assigned courses" on public.courses for select to authenticated
using (exists (select 1 from public.course_lecturers cl where cl.course_id = id and cl.lecturer_id = (select auth.uid()) and cl.is_active) or (select public.current_app_role()) = 'admin');

create policy "lecturers read own assignments" on public.course_lecturers for select to authenticated
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

create policy "booking owners read bookings" on public.bookings for select to authenticated
using (student_id = (select auth.uid()) or exists (select 1 from public.consultation_slots s where s.id = slot_id and s.lecturer_id = (select auth.uid())) or (select public.current_app_role()) = 'admin');

create policy "notification recipients read notifications" on public.consultation_notifications for select to authenticated
using (recipient_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');

create policy "lecturers create notifications" on public.consultation_notifications for insert to authenticated
with check (exists (select 1 from public.consultation_slots s where s.id = slot_id and (s.lecturer_id = (select auth.uid()) or (select public.current_app_role()) = 'admin')));

create policy "admins read audit" on public.consultation_audit_log for select to authenticated
using ((select public.current_app_role()) = 'admin');

create policy "lecturers create audit" on public.consultation_audit_log for insert to authenticated
with check (actor_id = (select auth.uid()) and (select public.current_app_role()) in ('lecturer', 'admin'));

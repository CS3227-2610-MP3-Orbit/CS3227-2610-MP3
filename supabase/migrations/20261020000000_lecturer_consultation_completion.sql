-- LEC-03: authorized Lecturer/Admin consultation read model and deactivation notices.
-- Completion is display-derived; no new booking status or write side effect is needed.
alter table public.consultation_slots add column if not exists is_active boolean not null default true;

create table if not exists public.in_app_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete cascade,
  kind text not null check (kind = 'consultation_deactivated'),
  message text not null check (length(trim(message)) > 0),
  created_at timestamptz not null default now(),
  unique (recipient_id, booking_id, kind)
);

alter table public.in_app_notifications enable row level security;
revoke all on table public.in_app_notifications from anon, authenticated;
create policy in_app_notifications_recipient_read
  on public.in_app_notifications for select to authenticated
  using (recipient_id = auth.uid());
grant select on public.in_app_notifications to authenticated;

create or replace function public.notify_consultation_deactivation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slot_id uuid;
  v_message text;
begin
  v_message := 'A consultation slot or course assignment was deactivated.';
  if tg_table_name = 'consultation_slots' and old.is_active and not new.is_active then
    insert into public.in_app_notifications (recipient_id, booking_id, kind, message)
    select x.recipient_id, x.booking_id, 'consultation_deactivated', v_message
    from (
      select b.id as booking_id, b.student_id as recipient_id
      from public.bookings b where b.slot_id = new.id and b.status = 'approved'
      union
      select b.id, new.lecturer_id from public.bookings b
      where b.slot_id = new.id and b.status = 'approved'
    ) x on conflict do nothing;
  elsif tg_table_name = 'course_lecturers' and old.is_active and not new.is_active then
    for v_slot_id in select s.id from public.consultation_slots s
      where s.course_id = new.course_id and s.lecturer_id = new.lecturer_id and s.is_active loop
      insert into public.in_app_notifications (recipient_id, booking_id, kind, message)
      select x.recipient_id, x.booking_id, 'consultation_deactivated', v_message
      from (
        select b.id as booking_id, b.student_id as recipient_id from public.bookings b
        where b.slot_id = v_slot_id and b.status = 'approved'
        union
        select b.id, new.lecturer_id from public.bookings b
        where b.slot_id = v_slot_id and b.status = 'approved'
      ) x on conflict do nothing;
    end loop;
  end if;
  return new;
end;
$$;

revoke all on function public.notify_consultation_deactivation() from public, anon, authenticated;
drop trigger if exists consultation_slot_deactivation_notice on public.consultation_slots;
create trigger consultation_slot_deactivation_notice
  after update of is_active on public.consultation_slots
  for each row execute function public.notify_consultation_deactivation();
drop trigger if exists course_assignment_deactivation_notice on public.course_lecturers;
create trigger course_assignment_deactivation_notice
  after update of is_active on public.course_lecturers
  for each row execute function public.notify_consultation_deactivation();

drop function if exists public.list_staff_consultations();
create or replace function public.list_staff_consultations(p_history boolean default false)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
set statement_timeout = '10s' as $$
declare
  v_role public.app_role := public.current_app_role();
  v_rows jsonb;
begin
  if v_role not in ('lecturer'::public.app_role, 'admin'::public.app_role) then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'bookingId', b.id,
    'slotId', s.id,
    'lecturerId', s.lecturer_id,
    'lecturerName', lp.full_name,
    'courseCode', c.code,
    'courseName', c.name,
    'startsAt', s.starts_at,
    'endsAt', s.ends_at,
    'studentName', sp.full_name,
    'studentEmail', coalesce(u.email, ''),
    'topic', b.topic,
    'questions', b.questions,
    'bookingStatus', b.status,
    'rejectionReason', b.rejection_reason,
    'displayStatus', case
      when b.status = 'approved' and clock_timestamp() < s.starts_at then 'upcoming'
      when b.status = 'approved' and clock_timestamp() < s.ends_at then 'ongoing'
      when b.status = 'approved' and clock_timestamp() >= s.ends_at then 'completed'
      else b.status::text
    end
  ) order by s.starts_at, b.id), '[]'::jsonb)
  into v_rows
  from public.bookings b
  join public.consultation_slots s on s.id = b.slot_id
  join public.courses c on c.id = s.course_id
  join public.profiles lp on lp.id = s.lecturer_id
  join public.profiles sp on sp.id = b.student_id
  left join auth.users u on u.id = b.student_id
  where (p_history or b.status in ('pending', 'approved'))
    and (not p_history or b.status in ('rejected', 'cancelled', 'completed'))
    and (v_role = 'admin'::public.app_role or s.lecturer_id = auth.uid())
    and (v_role = 'admin'::public.app_role or exists (
      select 1 from public.course_lecturers cl
      where cl.course_id = s.course_id and cl.lecturer_id = auth.uid() and cl.is_active
    ));

  return jsonb_build_object('kind', 'success', 'consultations', v_rows);
exception when others then
  return jsonb_build_object('kind', 'temporarily_unavailable');
end;
$$;

revoke all on function public.list_staff_consultations(boolean) from public, anon, authenticated;
grant execute on function public.list_staff_consultations(boolean) to authenticated;

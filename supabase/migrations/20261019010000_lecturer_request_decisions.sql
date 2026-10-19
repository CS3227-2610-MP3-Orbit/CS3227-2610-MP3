-- LEC-02: atomic Lecturer/Admin consultation request decisions.
-- This migration extends the shared booking model without rewriting prior migrations.

alter table public.bookings add column decision_version uuid not null default gen_random_uuid();

create or replace function public.my_booking_projection(p_booking_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'bookingId', b.id, 'slotId', s.id, 'status', b.status,
    'courseCode', c.code, 'courseName', c.name, 'lecturerName', p.full_name,
    'startsAt', to_char(s.starts_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'endsAt', to_char(s.ends_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'topic', b.topic, 'questions', b.questions, 'rejectionReason', b.rejection_reason,
    'version', b.manage_version
  )
  from public.bookings b join public.consultation_slots s on s.id=b.slot_id
  join public.courses c on c.id=s.course_id join public.profiles p on p.id=s.lecturer_id
  where b.id=p_booking_id and b.student_id=auth.uid();
$$;

create table public.consultation_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete restrict,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  kind text not null check (kind in ('approved', 'rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  unique (booking_id, kind)
);
alter table public.consultation_notifications enable row level security;
create policy "notifications: recipient reads own" on public.consultation_notifications
  for select to authenticated using (recipient_id = (select auth.uid()));
revoke insert, update, delete on public.consultation_notifications from anon, authenticated;

create table public.consultation_decision_audit (
  id bigint generated always as identity primary key,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  decision public.booking_status not null check (decision in ('approved', 'rejected')),
  created_at timestamptz not null default now()
);
alter table public.consultation_decision_audit enable row level security;
revoke all on public.consultation_decision_audit from anon, authenticated;

create table public.lecturer_decision_keys (
  actor_id uuid not null references public.profiles(id) on delete restrict,
  operation_key uuid not null,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  payload jsonb not null,
  result jsonb not null,
  primary key (actor_id, operation_key)
);
alter table public.lecturer_decision_keys enable row level security;
revoke all on public.lecturer_decision_keys from public, anon, authenticated;

create or replace function public.bump_booking_decision_version()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status or new.rejection_reason is distinct from old.rejection_reason then
    new.decision_version := gen_random_uuid();
    new.updated_at := clock_timestamp();
  else
    new.decision_version := old.decision_version;
  end if;
  return new;
end;
$$;
revoke all on function public.bump_booking_decision_version() from public, anon, authenticated;
create trigger bookings_bump_decision_version before update on public.bookings
for each row execute function public.bump_booking_decision_version();

create or replace function public.list_lecturer_requests()
returns jsonb language plpgsql stable security definer set search_path = ''
set lock_timeout = '5s' set statement_timeout = '10s' as $$
declare v_rows jsonb;
begin
  if public.current_app_role() not in ('lecturer'::public.app_role, 'admin'::public.app_role) then
    return jsonb_build_object('kind','forbidden_or_not_found');
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'bookingId',b.id,'slotId',s.id,'status',b.status,'courseCode',c.code,'courseName',c.name,
    'lecturerName',p.full_name,'startsAt',to_char(s.starts_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'endsAt',to_char(s.ends_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'topic',b.topic,'questions',b.questions,'studentId',b.student_id,'rejectionReason',b.rejection_reason,
    'version',b.decision_version) order by s.starts_at,b.id), '[]'::jsonb) into v_rows
  from public.bookings b join public.consultation_slots s on s.id=b.slot_id
  join public.courses c on c.id=s.course_id join public.profiles p on p.id=s.lecturer_id
  join public.course_lecturers cl on cl.course_id=s.course_id and cl.lecturer_id=s.lecturer_id and cl.is_active
  where b.status='pending' and (public.current_app_role()='admin'::public.app_role or s.lecturer_id=auth.uid());
  return jsonb_build_object('kind','success','requests',v_rows);
exception when lock_not_available or deadlock_detected or serialization_failure or query_canceled then
  return jsonb_build_object('kind','temporarily_unavailable','correlationId',gen_random_uuid());
end;
$$;

create or replace function public.decide_lecturer_request(
  p_booking_id uuid, p_decision public.booking_status, p_reason text, p_expected_version text, p_operation_key uuid
) returns jsonb language plpgsql security definer set search_path = ''
set lock_timeout = '5s' set statement_timeout = '10s' as $$
declare v_booking public.bookings%rowtype; v_slot public.consultation_slots%rowtype;
  v_payload jsonb; v_result jsonb; v_reason text; v_notification_ok boolean := true;
begin
  if public.current_app_role() not in ('lecturer'::public.app_role, 'admin'::public.app_role)
    then return jsonb_build_object('kind','forbidden_or_not_found'); end if;
  if p_booking_id is null or p_operation_key is null or p_expected_version is null
    or p_decision not in ('approved','rejected') then return jsonb_build_object('kind','validation_error','field','request'); end if;
  if octet_length(coalesce(p_reason,'')) > 200 then return jsonb_build_object('kind','validation_error','field','reason'); end if;
  v_reason := public.request_trim(coalesce(p_reason,''));
  if p_decision='rejected' and (v_reason is null or length(v_reason)=0) then return jsonb_build_object('kind','validation_error','field','reason'); end if;
  v_payload := jsonb_build_object('bookingId',p_booking_id,'decision',p_decision,'reason',v_reason,'version',p_expected_version);
  select result into v_result from public.lecturer_decision_keys where actor_id=auth.uid() and operation_key=p_operation_key and payload=v_payload;
  if v_result is not null then return v_result; end if;
  select * into v_booking from public.bookings where id=p_booking_id for update;
  if not found then return jsonb_build_object('kind','forbidden_or_not_found'); end if;
  select * into v_slot from public.consultation_slots where id=v_booking.slot_id for share;
  if not found or (public.current_app_role()='lecturer'::public.app_role and v_slot.lecturer_id<>auth.uid()) then return jsonb_build_object('kind','forbidden_or_not_found'); end if;
  if v_booking.status<>'pending' or v_booking.decision_version::text<>p_expected_version or v_slot.starts_at<=clock_timestamp() then
    return jsonb_build_object('kind','conflict','reason','request_changed');
  end if;
  update public.bookings set status=p_decision, rejection_reason=case when p_decision='rejected' then v_reason else null end where id=v_booking.id;
  insert into public.consultation_decision_audit(booking_id,actor_id,decision) values(v_booking.id,auth.uid(),p_decision);
  begin
    insert into public.consultation_notifications(recipient_id,booking_id,kind,rejection_reason)
      values(v_booking.student_id,v_booking.id,p_decision,v_reason);
  exception when others then v_notification_ok := false; end;
  v_result := jsonb_build_object('kind','success','bookingId',v_booking.id,'status',p_decision,'notificationPending',not v_notification_ok);
  insert into public.lecturer_decision_keys(actor_id,operation_key,booking_id,payload,result)
    values(auth.uid(),p_operation_key,v_booking.id,v_payload,v_result);
  return v_result;
exception when unique_violation then
  select result into v_result from public.lecturer_decision_keys where actor_id=auth.uid() and operation_key=p_operation_key;
  if v_result is not null then return v_result; end if;
  return jsonb_build_object('kind','conflict','reason','request_changed');
when lock_not_available or deadlock_detected or serialization_failure or query_canceled then
  return jsonb_build_object('kind','temporarily_unavailable','correlationId',gen_random_uuid());
end;
$$;

revoke all on function public.list_lecturer_requests() from public, anon, authenticated;
revoke all on function public.decide_lecturer_request(uuid,public.booking_status,text,text,uuid) from public, anon, authenticated;
grant execute on function public.list_lecturer_requests() to authenticated;
grant execute on function public.decide_lecturer_request(uuid,public.booking_status,text,text,uuid) to authenticated;

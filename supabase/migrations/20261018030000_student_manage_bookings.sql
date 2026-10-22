-- STU-04: narrow Student-owned booking management operations.
alter table public.bookings add column manage_version uuid not null default gen_random_uuid();

create table public.student_booking_operation_keys (
  student_id uuid not null references public.profiles(id) on delete restrict,
  idempotency_key uuid not null,
  operation text not null check (operation in ('update','cancel')),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  payload jsonb not null,
  result jsonb not null,
  primary key (student_id, idempotency_key)
);
alter table public.student_booking_operation_keys enable row level security;
revoke all on public.student_booking_operation_keys from public, anon, authenticated;

create function public.bump_booking_manage_version() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (new.topic, new.questions, new.status) is distinct from (old.topic, old.questions, old.status) then
    new.manage_version := gen_random_uuid();
    new.updated_at := clock_timestamp();
  else
    new.manage_version := old.manage_version;
  end if;
  return new;
end;
$$;
revoke all on function public.bump_booking_manage_version() from public, anon, authenticated;
create trigger bookings_bump_manage_version before update on public.bookings
for each row execute function public.bump_booking_manage_version();

create function public.my_booking_projection(p_booking_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'bookingId', b.id, 'slotId', s.id, 'status', b.status,
    'courseCode', c.code, 'courseName', c.name, 'lecturerName', p.full_name,
    'startsAt', to_char(s.starts_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'endsAt', to_char(s.ends_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'topic', b.topic, 'questions', b.questions, 'version', b.manage_version
  )
  from public.bookings b
  join public.consultation_slots s on s.id=b.slot_id
  join public.courses c on c.id=s.course_id
  join public.profiles p on p.id=s.lecturer_id
  where b.id=p_booking_id and b.student_id=auth.uid()
$$;
revoke all on function public.my_booking_projection(uuid) from public, anon, authenticated;

create function public.list_my_bookings() returns jsonb
language plpgsql security definer set search_path = ''
set lock_timeout = '5s' set statement_timeout = '10s' as $$
declare v_rows jsonb;
begin
  perform 1 from public.profiles where id=auth.uid() and is_active and role='student' for share;
  if not found then return jsonb_build_object('kind','forbidden_or_not_found'); end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'bookingId',b.id,'slotId',s.id,'status',b.status,'courseCode',c.code,'courseName',c.name,
    'lecturerName',p.full_name,
    'startsAt',to_char(s.starts_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'endsAt',to_char(s.ends_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'topic',b.topic,'version',b.manage_version) order by s.starts_at desc,b.id), '[]'::jsonb) into v_rows
  from public.bookings b join public.consultation_slots s on s.id=b.slot_id
  join public.courses c on c.id=s.course_id join public.profiles p on p.id=s.lecturer_id
  where b.student_id=auth.uid();
  return jsonb_build_object('kind','success','bookings',v_rows);
exception when lock_not_available or deadlock_detected or serialization_failure or query_canceled then
  return jsonb_build_object('kind','temporarily_unavailable','correlationId',gen_random_uuid());
end;
$$;

create function public.get_my_booking(p_booking_id uuid) returns jsonb
language plpgsql security definer set search_path = ''
set lock_timeout = '5s' set statement_timeout = '10s' as $$
declare v_booking jsonb;
begin
  perform 1 from public.profiles where id=auth.uid() and is_active and role='student' for share;
  if not found then return jsonb_build_object('kind','forbidden_or_not_found'); end if;
  select public.my_booking_projection(p_booking_id) into v_booking;
  if v_booking is null then return jsonb_build_object('kind','forbidden_or_not_found'); end if;
  return jsonb_build_object('kind','success','booking',v_booking);
exception when lock_not_available or deadlock_detected or serialization_failure or query_canceled then
  return jsonb_build_object('kind','temporarily_unavailable','correlationId',gen_random_uuid());
end;
$$;

create function public.update_my_booking(p_booking_id uuid,p_expected_version text,p_topic text,p_questions text,p_idempotency_key uuid) returns jsonb
language plpgsql security definer set search_path = ''
set lock_timeout = '5s' set statement_timeout = '10s' as $$
declare v_booking public.bookings%rowtype; v_key public.student_booking_operation_keys%rowtype;
  v_topic text; v_questions text; v_payload jsonb; v_result jsonb;
begin
  perform 1 from public.profiles where id=auth.uid() and is_active and role='student' for update;
  if not found then return jsonb_build_object('kind','forbidden_or_not_found'); end if;
  if p_booking_id is null then return jsonb_build_object('kind','validation_error','field','bookingId'); end if;
  if p_idempotency_key is null then return jsonb_build_object('kind','validation_error','field','idempotencyKey'); end if;
  if p_expected_version is null or length(p_expected_version) not between 1 and 512 then return jsonb_build_object('kind','validation_error','field','version'); end if;
  if octet_length(coalesce(p_topic,''))+octet_length(coalesce(p_questions,''))+octet_length(p_expected_version)+72 > 16384 then return jsonb_build_object('kind','validation_error','field','request'); end if;
  v_topic:=public.request_trim(p_topic); v_questions:=public.request_trim(p_questions);
  if v_topic is null or length(v_topic) not between 1 and 200 then return jsonb_build_object('kind','validation_error','field','topic'); end if;
  if v_questions is null or length(v_questions) not between 1 and 2000 then return jsonb_build_object('kind','validation_error','field','questions'); end if;
  v_payload:=jsonb_build_object('bookingId',p_booking_id,'version',p_expected_version,'topic',v_topic,'questions',v_questions);
  select * into v_key from public.student_booking_operation_keys where student_id=auth.uid() and idempotency_key=p_idempotency_key;
  if found then
    if v_key.operation <> 'update' or v_key.payload <> v_payload then return jsonb_build_object('kind','conflict','reason','idempotency_mismatch'); end if;
    return v_key.result;
  end if;
  select * into v_booking from public.bookings where id=p_booking_id and student_id=auth.uid() for update;
  if not found then return jsonb_build_object('kind','forbidden_or_not_found'); end if;
  if v_booking.status <> 'pending' or p_expected_version <> v_booking.manage_version::text then return jsonb_build_object('kind','conflict','reason','booking_changed'); end if;
  update public.bookings set topic=v_topic,questions=v_questions where id=v_booking.id;
  select jsonb_build_object('kind','success','booking',public.my_booking_projection(v_booking.id)) into v_result;
  insert into public.student_booking_operation_keys values(auth.uid(),p_idempotency_key,'update',v_booking.id,v_payload,v_result);
  return v_result;
exception when lock_not_available or deadlock_detected or serialization_failure or query_canceled then
  return jsonb_build_object('kind','temporarily_unavailable','correlationId',gen_random_uuid());
end;
$$;

create function public.cancel_my_booking(p_booking_id uuid,p_expected_version text,p_idempotency_key uuid) returns jsonb
language plpgsql security definer set search_path = ''
set lock_timeout = '5s' set statement_timeout = '10s' as $$
declare v_booking public.bookings%rowtype; v_slot public.consultation_slots%rowtype;
  v_key public.student_booking_operation_keys%rowtype; v_payload jsonb; v_result jsonb;
begin
  perform 1 from public.profiles where id=auth.uid() and is_active and role='student' for update;
  if not found then return jsonb_build_object('kind','forbidden_or_not_found'); end if;
  if p_booking_id is null then return jsonb_build_object('kind','validation_error','field','bookingId'); end if;
  if p_idempotency_key is null then return jsonb_build_object('kind','validation_error','field','idempotencyKey'); end if;
  if p_expected_version is null or length(p_expected_version) not between 1 and 512 then return jsonb_build_object('kind','validation_error','field','version'); end if;
  v_payload:=jsonb_build_object('bookingId',p_booking_id,'version',p_expected_version);
  select * into v_key from public.student_booking_operation_keys where student_id=auth.uid() and idempotency_key=p_idempotency_key;
  if found then
    if v_key.operation <> 'cancel' or v_key.payload <> v_payload then return jsonb_build_object('kind','conflict','reason','idempotency_mismatch'); end if;
    return v_key.result;
  end if;
  select * into v_booking from public.bookings where id=p_booking_id and student_id=auth.uid() for update;
  if not found then return jsonb_build_object('kind','forbidden_or_not_found'); end if;
  select * into v_slot from public.consultation_slots where id=v_booking.slot_id for share;
  if v_booking.status not in ('pending','approved') or p_expected_version <> v_booking.manage_version::text or v_slot.starts_at <= clock_timestamp() then
    return jsonb_build_object('kind','conflict','reason','booking_changed');
  end if;
  update public.bookings set status='cancelled' where id=v_booking.id;
  select jsonb_build_object('kind','success','booking',public.my_booking_projection(v_booking.id)) into v_result;
  insert into public.student_booking_operation_keys values(auth.uid(),p_idempotency_key,'cancel',v_booking.id,v_payload,v_result);
  return v_result;
exception when lock_not_available or deadlock_detected or serialization_failure or query_canceled then
  return jsonb_build_object('kind','temporarily_unavailable','correlationId',gen_random_uuid());
end;
$$;

revoke all on function public.list_my_bookings() from public, anon, authenticated;
revoke all on function public.get_my_booking(uuid) from public, anon, authenticated;
revoke all on function public.update_my_booking(uuid,text,text,text,uuid) from public, anon, authenticated;
revoke all on function public.cancel_my_booking(uuid,text,uuid) from public, anon, authenticated;
grant execute on function public.list_my_bookings() to authenticated;
grant execute on function public.get_my_booking(uuid) to authenticated;
grant execute on function public.update_my_booking(uuid,text,text,text,uuid) to authenticated;
grant execute on function public.cancel_my_booking(uuid,text,uuid) to authenticated;

-- STU-02: narrow, authenticated request operations. No direct application table writes.
alter table public.consultation_slots add column request_version uuid not null default gen_random_uuid();

create table public.consultation_request_keys (
  student_id uuid not null references public.profiles(id) on delete restrict,
  idempotency_key uuid not null,
  booking_id uuid not null unique references public.bookings(id) on delete restrict,
  payload jsonb not null,
  primary key (student_id, idempotency_key)
);
alter table public.consultation_request_keys enable row level security;
revoke all on public.consultation_request_keys from public, anon, authenticated;

create function public.guard_requested_slot_details() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (new.id, new.course_id, new.lecturer_id, new.starts_at, new.ends_at)
     is distinct from (old.id, old.course_id, old.lecturer_id, old.starts_at, old.ends_at) then
    if exists (select 1 from public.bookings where slot_id=old.id and status in ('pending','approved')) then
      raise exception using errcode='23514', message='reserved slot details cannot change';
    end if;
    new.request_version := gen_random_uuid();
  else
    new.request_version := old.request_version;
  end if;
  return new;
end;
$$;
revoke all on function public.guard_requested_slot_details() from public, anon, authenticated;
create trigger guard_requested_slot_details before update on public.consultation_slots
for each row execute function public.guard_requested_slot_details();

-- PostgreSQL UTF-8 text already excludes NUL and invalid Unicode. Match ECMAScript trim exactly.
create function public.request_trim(value text) returns text language sql immutable
set search_path = '' as $$
  select btrim(value, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')
$$;
revoke all on function public.request_trim(text) from public, anon, authenticated;

create function public.get_request_slot(p_slot_id uuid) returns jsonb
language plpgsql security definer set search_path = ''
set lock_timeout = '5s' set statement_timeout = '10s' as $$
declare v_slot jsonb;
begin
  if public.current_app_role() is distinct from 'student'::public.app_role then
    return jsonb_build_object('kind','forbidden_or_not_found');
  end if;
  select jsonb_build_object('slotId',s.id,'courseId',c.id,'courseCode',c.code,'courseName',c.name,
    'lecturerId',p.id,'lecturerName',p.full_name,'startsAt',s.starts_at,'endsAt',s.ends_at,
    'slotVersion',s.request_version) into v_slot
  from public.consultation_slots s join public.courses c on c.id=s.course_id and c.is_active
  join public.profiles p on p.id=s.lecturer_id and p.is_active and p.role='lecturer'
  where s.id=p_slot_id and s.starts_at>clock_timestamp() and s.ends_at>s.starts_at
    and exists (select 1 from public.course_lecturers a where a.course_id=c.id and a.lecturer_id=p.id and a.is_active)
    and not exists (select 1 from public.bookings b where b.slot_id=s.id and b.status in ('pending','approved','completed'));
  if v_slot is null then return jsonb_build_object('kind','forbidden_or_not_found'); end if;
  return jsonb_build_object('kind','success','slot',v_slot);
end;
$$;

create function public.recover_consultation(p_idempotency_key uuid) returns jsonb
language plpgsql security definer set search_path = ''
set lock_timeout = '5s' set statement_timeout = '10s' as $$
declare v_receipt jsonb;
begin
  -- Lock the actor so deactivation cannot pass an authorization check concurrently.
  perform 1 from public.profiles where id=auth.uid() and is_active and role='student' for share;
  if not found then return jsonb_build_object('kind','forbidden_or_not_found'); end if;
  select jsonb_build_object('bookingId',b.id,'slotId',b.slot_id,'status',b.status) into v_receipt
  from public.consultation_request_keys k join public.bookings b on b.id=k.booking_id
  where k.student_id=auth.uid() and k.idempotency_key=p_idempotency_key and b.student_id=auth.uid();
  if v_receipt is null then return jsonb_build_object('kind','forbidden_or_not_found'); end if;
  return jsonb_build_object('kind','success','receipt',v_receipt);
end;
$$;

create function public.request_consultation(p_slot_id uuid,p_slot_version text,p_topic text,p_questions text,p_idempotency_key uuid)
returns jsonb language plpgsql security definer set search_path = ''
set lock_timeout = '5s' set statement_timeout = '10s' as $$
declare
  v_student uuid := auth.uid(); v_slot public.consultation_slots%rowtype;
  v_key public.consultation_request_keys%rowtype; v_booking public.bookings%rowtype;
  v_topic text; v_questions text; v_payload jsonb;
begin
  -- A real row lock both serializes this Student's requests and coordinates deactivation.
  perform 1 from public.profiles where id=v_student and is_active and role='student' for update;
  if not found then return jsonb_build_object('kind','forbidden_or_not_found'); end if;
  if p_slot_id is null then return jsonb_build_object('kind','validation_error','field','slotId'); end if;
  if p_idempotency_key is null then return jsonb_build_object('kind','validation_error','field','idempotencyKey'); end if;
  if p_slot_version is null or length(p_slot_version) not between 1 and 512 then
    return jsonb_build_object('kind','validation_error','field','slotVersion');
  end if;
  if octet_length(coalesce(p_topic,''))+octet_length(coalesce(p_questions,''))+octet_length(p_slot_version)+72 > 16384 then
    return jsonb_build_object('kind','validation_error','field','request');
  end if;
  v_topic := public.request_trim(p_topic); v_questions := public.request_trim(p_questions);
  if v_topic is null or length(v_topic) not between 1 and 200 then return jsonb_build_object('kind','validation_error','field','topic'); end if;
  if v_questions is null or length(v_questions) not between 1 and 2000 then return jsonb_build_object('kind','validation_error','field','questions'); end if;
  v_payload := jsonb_build_object('slotId',p_slot_id,'slotVersion',p_slot_version,'topic',v_topic,'questions',v_questions);
  select * into v_key from public.consultation_request_keys where student_id=v_student and idempotency_key=p_idempotency_key;
  if found then
    if v_key.payload <> v_payload then return jsonb_build_object('kind','conflict','reason','idempotency_mismatch'); end if;
    return public.recover_consultation(p_idempotency_key);
  end if;

  select * into v_slot from public.consultation_slots where id=p_slot_id for update;
  if not found then return jsonb_build_object('kind','conflict','reason','slot_unavailable'); end if;
  -- SHARE locks conflict with endpoint UPDATE and DELETE, not merely key changes.
  perform 1 from public.courses where id=v_slot.course_id and is_active for share;
  if not found then return jsonb_build_object('kind','conflict','reason','slot_unavailable'); end if;
  perform 1 from public.profiles where id=v_slot.lecturer_id and is_active and role='lecturer' for share;
  if not found then return jsonb_build_object('kind','conflict','reason','slot_unavailable'); end if;
  perform 1 from public.course_lecturers where course_id=v_slot.course_id and lecturer_id=v_slot.lecturer_id and is_active for share;
  if not found then return jsonb_build_object('kind','conflict','reason','slot_unavailable'); end if;
  -- Fresh wall time AFTER every possible wait; transaction now() is deliberately not used.
  if v_slot.starts_at <= clock_timestamp() or v_slot.ends_at <= v_slot.starts_at or exists
    (select 1 from public.bookings where slot_id=p_slot_id and status in ('pending','approved','completed')) then
    return jsonb_build_object('kind','conflict','reason','slot_unavailable');
  end if;
  if p_slot_version <> v_slot.request_version::text then return jsonb_build_object('kind','conflict','reason','slot_changed'); end if;
  if exists (select 1 from public.bookings b join public.consultation_slots s on s.id=b.slot_id
    where b.student_id=v_student and b.status in ('pending','approved')
    and s.starts_at<v_slot.ends_at and s.ends_at>v_slot.starts_at) then
    return jsonb_build_object('kind','conflict','reason','student_overlap');
  end if;
  insert into public.bookings(slot_id,student_id,topic,questions,status,rejection_reason)
    values(p_slot_id,v_student,v_topic,v_questions,'pending',null) returning * into v_booking;
  insert into public.consultation_request_keys(student_id,idempotency_key,booking_id,payload)
    values(v_student,p_idempotency_key,v_booking.id,v_payload);
  return jsonb_build_object('kind','success','receipt',jsonb_build_object('bookingId',v_booking.id,'slotId',v_booking.slot_id,'status',v_booking.status));
exception
  when unique_violation then return jsonb_build_object('kind','conflict','reason','slot_unavailable');
  when lock_not_available or deadlock_detected or serialization_failure or query_canceled then
    -- The PL/pgSQL exception subtransaction has rolled back every write before this result.
    return jsonb_build_object('kind','temporarily_unavailable','correlationId',gen_random_uuid());
end;
$$;
revoke all on function public.get_request_slot(uuid) from public, anon, authenticated;
revoke all on function public.recover_consultation(uuid) from public, anon, authenticated;
revoke all on function public.request_consultation(uuid,text,text,text,uuid) from public, anon, authenticated;
grant execute on function public.get_request_slot(uuid) to authenticated;
grant execute on function public.recover_consultation(uuid) to authenticated;
grant execute on function public.request_consultation(uuid,text,text,text,uuid) to authenticated;

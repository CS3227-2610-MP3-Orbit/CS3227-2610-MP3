-- STU-04/LEC-03: display an approved booking as completed after its slot ends.
-- The stored booking status remains approved; this is a read-model derivation only.

create or replace function public.my_booking_projection(p_booking_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'bookingId', b.id, 'slotId', s.id,
    'status', case
      when b.status = 'approved' and clock_timestamp() >= s.ends_at then 'completed'
      else b.status::text
    end,
    'courseCode', c.code, 'courseName', c.name, 'lecturerName', p.full_name,
    'startsAt', to_char(s.starts_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'endsAt', to_char(s.ends_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'topic', b.topic, 'questions', b.questions,
    'rejectionReason', b.rejection_reason,
    'version', b.manage_version
  )
  from public.bookings b
  join public.consultation_slots s on s.id=b.slot_id
  join public.courses c on c.id=s.course_id
  join public.profiles p on p.id=s.lecturer_id
  where b.id=p_booking_id and b.student_id=auth.uid()
$$;

create or replace function public.list_my_bookings() returns jsonb
language plpgsql security definer set search_path = ''
set lock_timeout = '5s' set statement_timeout = '10s' as $$
declare v_rows jsonb;
begin
  perform 1 from public.profiles where id=auth.uid() and is_active and role='student' for share;
  if not found then return jsonb_build_object('kind','forbidden_or_not_found'); end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'bookingId',b.id,'slotId',s.id,
    'status',case when b.status='approved' and clock_timestamp() >= s.ends_at then 'completed' else b.status::text end,
    'courseCode',c.code,'courseName',c.name,'lecturerName',p.full_name,
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

revoke all on function public.list_my_bookings() from public, anon, authenticated;
revoke all on function public.my_booking_projection(uuid) from public, anon, authenticated;
grant execute on function public.list_my_bookings() to authenticated;



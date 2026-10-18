-- STU-02 F-TV02-02: inherit SH-03-R11's canonical UTC-Z timestamp contract.
create or replace function public.get_request_slot(p_slot_id uuid) returns jsonb
language plpgsql security definer set search_path = ''
set lock_timeout = '5s' set statement_timeout = '10s' as $$
declare v_slot jsonb;
begin
  if public.current_app_role() is distinct from 'student'::public.app_role then
    return jsonb_build_object('kind','forbidden_or_not_found');
  end if;
  select jsonb_build_object('slotId',s.id,'courseId',c.id,'courseCode',c.code,'courseName',c.name,
    'lecturerId',p.id,'lecturerName',p.full_name,
    'startsAt',to_char(s.starts_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'endsAt',to_char(s.ends_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
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

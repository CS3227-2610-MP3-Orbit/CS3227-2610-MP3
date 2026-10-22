-- LEC-01-AC7: require an explicit confirmation before attempting to edit a slot
-- that has pending or approved bookings. The STU-02 trigger still rejects the
-- confirmed edit with `reserved`; confirmation is a separate safety boundary.
create or replace function public.lecturer_update_slot(
  p_slot_id uuid,
  p_course_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_confirm boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set lock_timeout = '5s'
set statement_timeout = '10s'
as $$
declare
  v_uid uuid := (select auth.uid());
  v_students uuid[];
begin
  if public.current_app_role() is distinct from 'lecturer'::public.app_role then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;
  if p_slot_id is null or p_course_id is null or p_starts_at is null or p_ends_at is null
     or p_ends_at <= p_starts_at then
    return jsonb_build_object('kind', 'validation_error');
  end if;
  if p_starts_at < now() + interval '1 hour' then
    return jsonb_build_object('kind', 'too_soon');
  end if;

  perform pg_advisory_xact_lock(hashtext('public.consultation_slots.lecturer'), hashtext(v_uid::text));

  perform 1 from public.consultation_slots s
  where s.id = p_slot_id and s.lecturer_id = v_uid
  for update;
  if not found then
    return jsonb_build_object('kind', 'not_found');
  end if;

  if not exists (
    select 1
    from public.course_lecturers cl
    join public.courses c on c.id = cl.course_id
    where cl.course_id = p_course_id and cl.lecturer_id = v_uid and cl.is_active and c.is_active
  ) then
    return jsonb_build_object('kind', 'not_assigned');
  end if;

  if exists (
    select 1
    from public.consultation_slots s
    where s.lecturer_id = v_uid and s.id <> p_slot_id
      and s.starts_at < p_ends_at and s.ends_at > p_starts_at
  ) then
    return jsonb_build_object('kind', 'overlap');
  end if;

  select coalesce(array_agg(b.student_id), '{}') into v_students
  from public.bookings b
  where b.slot_id = p_slot_id and b.status in ('pending', 'approved');

  if cardinality(v_students) > 0 and not coalesce(p_confirm, false) then
    return jsonb_build_object('kind', 'confirmation_required');
  end if;

  begin
    update public.consultation_slots
    set course_id = p_course_id, starts_at = p_starts_at, ends_at = p_ends_at, updated_at = now()
    where id = p_slot_id;
  exception when check_violation then
    return jsonb_build_object('kind', 'reserved');
  end;

  insert into public.consultation_audit_log (actor_id, slot_id, action, outcome)
  values (v_uid, p_slot_id, 'updated', 'success');
  insert into public.consultation_notifications (recipient_id, slot_id, kind, message)
  select student_id, p_slot_id, 'slot_updated', 'A consultation slot you booked has been updated.'
  from unnest(v_students) as student_id;

  return jsonb_build_object('kind', 'ok');
exception
  when lock_not_available or deadlock_detected or serialization_failure or query_canceled then
    return jsonb_build_object('kind', 'temporarily_unavailable', 'correlationId', gen_random_uuid());
end;
$$;

revoke all on function public.lecturer_update_slot(uuid, uuid, timestamptz, timestamptz, boolean)
  from public, anon, authenticated;
grant execute on function public.lecturer_update_slot(uuid, uuid, timestamptz, timestamptz, boolean)
  to authenticated;

-- LEC-01 "Data access path" and LEC-04-AC7: role-checked functions for every lecturer read and
-- write. STU-01 (20261018000000) revokes all direct table privileges on courses,
-- course_lecturers, consultation_slots and bookings from "authenticated" (STU-01-AC21), so the
-- lecturer dashboard's direct queries returned nothing and slot creation failed with "permission
-- denied". These functions follow the ADM-02 house pattern: security definer, search_path = '',
-- role check first, the lecturer derived from auth.uid(), and typed jsonb results. No table
-- privilege is granted. Parameters are prefixed p_ so plpgsql never shadows a column name.

-- ---------------------------------------------------------------------------
-- Reads for the dashboard.
-- ---------------------------------------------------------------------------

create function public.lecturer_list_my_courses()
returns table (id uuid, code text, name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.current_app_role() is distinct from 'lecturer'::public.app_role then
    return;
  end if;

  return query
  select c.id, c.code, c.name
  from public.courses c
  where c.is_active
    and exists (
      select 1
      from public.course_lecturers cl
      where cl.course_id = c.id
        and cl.lecturer_id = (select auth.uid())
        and cl.is_active
    )
  order by c.code;
end;
$$;

create function public.lecturer_list_my_slots()
returns table (
  id uuid,
  course_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  course_code text,
  course_name text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.current_app_role() is distinct from 'lecturer'::public.app_role then
    return;
  end if;

  return query
  select s.id, s.course_id, s.starts_at, s.ends_at, c.code, c.name
  from public.consultation_slots s
  join public.courses c on c.id = s.course_id
  where s.lecturer_id = (select auth.uid())
  order by s.starts_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- Slot writes. Each takes a per-lecturer advisory lock so two concurrent changes by the same
-- lecturer cannot both pass the overlap check (LEC-01-AC10).
-- ---------------------------------------------------------------------------

create function public.lecturer_create_slot(
  p_course_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz
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
  v_id uuid;
begin
  if public.current_app_role() is distinct from 'lecturer'::public.app_role then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;
  if p_course_id is null or p_starts_at is null or p_ends_at is null
     or p_ends_at <= p_starts_at then
    return jsonb_build_object('kind', 'validation_error');
  end if;
  if p_starts_at < now() + interval '1 hour' then
    return jsonb_build_object('kind', 'too_soon');
  end if;

  perform pg_advisory_xact_lock(hashtext('public.consultation_slots.lecturer'), hashtext(v_uid::text));

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
    where s.lecturer_id = v_uid and s.starts_at < p_ends_at and s.ends_at > p_starts_at
  ) then
    return jsonb_build_object('kind', 'overlap');
  end if;

  insert into public.consultation_slots (lecturer_id, course_id, starts_at, ends_at)
  values (v_uid, p_course_id, p_starts_at, p_ends_at)
  returning consultation_slots.id into v_id;

  insert into public.consultation_audit_log (actor_id, slot_id, action, outcome)
  values (v_uid, v_id, 'created', 'success');

  return jsonb_build_object('kind', 'ok', 'id', v_id);
end;
$$;

create function public.lecturer_update_slot(
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
    -- guard_requested_slot_details (STU-02) refuses to change a slot that has a pending or
    -- approved booking, even after confirmation.
    return jsonb_build_object('kind', 'reserved');
  end;

  insert into public.consultation_audit_log (actor_id, slot_id, action, outcome)
  values (v_uid, p_slot_id, 'updated', 'success');
  insert into public.consultation_notifications (recipient_id, slot_id, kind, message)
  select student_id, p_slot_id, 'slot_updated', 'A consultation slot you booked has been updated.'
  from unnest(v_students) as student_id;

  return jsonb_build_object('kind', 'ok');
end;
$$;

create function public.lecturer_delete_slot(p_slot_id uuid, p_confirm boolean default false)
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
  if p_slot_id is null then
    return jsonb_build_object('kind', 'not_found');
  end if;

  perform pg_advisory_xact_lock(hashtext('public.consultation_slots.lecturer'), hashtext(v_uid::text));

  perform 1 from public.consultation_slots s
  where s.id = p_slot_id and s.lecturer_id = v_uid
  for update;
  if not found then
    return jsonb_build_object('kind', 'not_found');
  end if;

  select coalesce(array_agg(b.student_id), '{}') into v_students
  from public.bookings b
  where b.slot_id = p_slot_id and b.status in ('pending', 'approved');
  if cardinality(v_students) > 0 and not coalesce(p_confirm, false) then
    return jsonb_build_object('kind', 'confirmation_required');
  end if;

  begin
    -- Audit and notifications are written first: their slot_id becomes null when the slot is
    -- deleted (on delete set null), and all of it rolls back together if the delete fails.
    insert into public.consultation_audit_log (actor_id, slot_id, action, outcome)
    values (v_uid, p_slot_id, 'deleted', 'success');
    insert into public.consultation_notifications (recipient_id, slot_id, kind, message)
    select student_id, p_slot_id, 'slot_deleted', 'A consultation slot you booked has been deleted.'
    from unnest(v_students) as student_id;
    delete from public.consultation_slots where id = p_slot_id;
  exception when foreign_key_violation then
    -- bookings.slot_id is "on delete restrict": a slot with any booking history is kept.
    return jsonb_build_object('kind', 'has_bookings');
  end;

  return jsonb_build_object('kind', 'ok');
end;
$$;

-- ---------------------------------------------------------------------------
-- LEC-04-AC7: the data an AI briefing may use, for one approved upcoming consultation on the
-- caller's own slot. The student's email is deliberately not returned.
-- ---------------------------------------------------------------------------

create function public.lecturer_get_briefing_context(p_booking_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_row record;
begin
  if public.current_app_role() is distinct from 'lecturer'::public.app_role then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;

  select b.id, b.topic, b.questions, s.starts_at, c.code, c.name, p.full_name
  into v_row
  from public.bookings b
  join public.consultation_slots s on s.id = b.slot_id
  join public.courses c on c.id = s.course_id
  join public.profiles p on p.id = b.student_id
  where b.id = p_booking_id
    and s.lecturer_id = (select auth.uid())
    and b.status = 'approved';
  if not found then
    return jsonb_build_object('kind', 'not_found');
  end if;
  if v_row.starts_at <= now() then
    return jsonb_build_object('kind', 'not_upcoming');
  end if;

  return jsonb_build_object(
    'kind', 'ok',
    'bookingId', v_row.id,
    'studentName', v_row.full_name,
    'courseCode', v_row.code,
    'courseName', v_row.name,
    'topic', v_row.topic,
    'questions', v_row.questions
  );
end;
$$;

-- Saving a briefing: the insert policy on lecturer_ai_briefings checks ownership by reading
-- bookings and consultation_slots as the caller, which the revoked grants make impossible, so the
-- save goes through this function with the same ownership, status and length rules.
create function public.lecturer_save_briefing(p_booking_id uuid, p_content text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
begin
  if public.current_app_role() is distinct from 'lecturer'::public.app_role then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;
  if p_content is null or length(trim(p_content)) = 0 or length(p_content) > 12000 then
    return jsonb_build_object('kind', 'validation_error');
  end if;
  if not exists (
    select 1
    from public.bookings b
    join public.consultation_slots s on s.id = b.slot_id
    where b.id = p_booking_id and s.lecturer_id = v_uid and b.status = 'approved'
  ) then
    return jsonb_build_object('kind', 'not_found');
  end if;

  insert into public.lecturer_ai_briefings (lecturer_id, booking_id, content)
  values (v_uid, p_booking_id, p_content)
  returning lecturer_ai_briefings.id into v_id;
  return jsonb_build_object('kind', 'ok', 'id', v_id);
end;
$$;

revoke all on function public.lecturer_list_my_courses() from public, anon, authenticated;
revoke all on function public.lecturer_list_my_slots() from public, anon, authenticated;
revoke all on function public.lecturer_create_slot(uuid, timestamptz, timestamptz)
  from public, anon, authenticated;
revoke all on function public.lecturer_update_slot(uuid, uuid, timestamptz, timestamptz, boolean)
  from public, anon, authenticated;
revoke all on function public.lecturer_delete_slot(uuid, boolean) from public, anon, authenticated;
revoke all on function public.lecturer_get_briefing_context(uuid) from public, anon, authenticated;
revoke all on function public.lecturer_save_briefing(uuid, text) from public, anon, authenticated;

grant execute on function public.lecturer_list_my_courses() to authenticated;
grant execute on function public.lecturer_list_my_slots() to authenticated;
grant execute on function public.lecturer_create_slot(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.lecturer_update_slot(uuid, uuid, timestamptz, timestamptz, boolean)
  to authenticated;
grant execute on function public.lecturer_delete_slot(uuid, boolean) to authenticated;
grant execute on function public.lecturer_get_briefing_context(uuid) to authenticated;
grant execute on function public.lecturer_save_briefing(uuid, text) to authenticated;

-- The courses policy compared course_lecturers to itself (cl.course_id = cl.id), so it could
-- never match. It is inert today because the table has no grant, but it is corrected so the
-- rule says what it means if a grant is ever added.
drop policy "lecturers read assigned courses" on public.courses;
create policy "lecturers read assigned courses" on public.courses
  for select to authenticated
  using (
    exists (
      select 1
      from public.course_lecturers cl
      where cl.course_id = courses.id
        and cl.lecturer_id = (select auth.uid())
        and cl.is_active
    )
    or (select public.current_app_role()) = 'admin'::public.app_role
  );

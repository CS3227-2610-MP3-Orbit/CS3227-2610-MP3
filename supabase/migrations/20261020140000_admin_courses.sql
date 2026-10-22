-- ADM-02: database layer for admin course and lecturer-assignment management (create/edit
-- courses, deactivate/reactivate, assign/remove lecturer assignments, list/search/filter).
-- No direct table writes from the app: courses/course_lecturers already revoke all
-- authenticated/anon table privileges (20261018000000); every write and read here goes through
-- a new security-definer RPC only, matching ADM-01's admin_set_role/admin_set_active/
-- admin_list_accounts pattern. All RPC parameters are prefixed p_ to avoid plpgsql shadowing a
-- same-named column (courses.code/name/is_active, course_lecturers.course_id/lecturer_id) --
-- the same reason admin_list_accounts named its filters p_query/p_role/p_active.

-- ---------------------------------------------------------------------------
-- ADM-02-R1: normalized-code uniqueness, spanning active and inactive courses.
-- ---------------------------------------------------------------------------

-- Not partial (unlike course_lecturers_current_pair_idx): a duplicate normalized code is
-- refused against ANY existing course, active or inactive alike (ADM-02-R1). courses.code is
-- always stored already upper(trim())'d by the RPCs below, but the index expression matches
-- the normalization rule itself rather than relying on that storage convention.
create unique index courses_code_normalized_idx
  on public.courses (upper(trim(code)));

-- ---------------------------------------------------------------------------
-- ADM-02-R1/R8: create a course.
-- ---------------------------------------------------------------------------

create function public.admin_create_course(p_code text, p_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
set lock_timeout = '5s'
set statement_timeout = '10s'
as $$
declare
  v_code text;
  v_name text;
  v_id uuid;
begin
  if public.current_app_role() is distinct from 'admin'::public.app_role then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;

  if p_code is null then
    return jsonb_build_object('kind', 'validation_error', 'field', 'code');
  end if;
  v_code := upper(trim(p_code));
  if v_code !~ '^[A-Z0-9/_-]{2,20}$' then
    return jsonb_build_object('kind', 'validation_error', 'field', 'code');
  end if;

  if p_name is null then
    return jsonb_build_object('kind', 'validation_error', 'field', 'name');
  end if;
  v_name := trim(p_name);
  if length(v_name) < 1 or length(v_name) > 200 then
    return jsonb_build_object('kind', 'validation_error', 'field', 'name');
  end if;

  if exists (select 1 from public.courses where upper(trim(code)) = v_code) then
    return jsonb_build_object('kind', 'conflict_duplicate_code');
  end if;

  insert into public.courses (code, name, is_active)
  values (v_code, v_name, true)
  returning id into v_id;

  return jsonb_build_object(
    'kind', 'success', 'courseId', v_id, 'code', v_code, 'name', v_name, 'isActive', true
  );
exception
  when unique_violation then
    return jsonb_build_object('kind', 'conflict_duplicate_code');
  when lock_not_available or deadlock_detected or serialization_failure or query_canceled then
    return jsonb_build_object('kind', 'temporarily_unavailable', 'correlationId', gen_random_uuid());
end;
$$;

-- ---------------------------------------------------------------------------
-- ADM-02-R2/R8: edit an existing course's code/name.
-- ---------------------------------------------------------------------------

create function public.admin_update_course(p_course_id uuid, p_code text, p_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
set lock_timeout = '5s'
set statement_timeout = '10s'
as $$
declare
  v_code text;
  v_name text;
  v_is_active boolean;
begin
  if public.current_app_role() is distinct from 'admin'::public.app_role then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;

  if p_course_id is null then
    return jsonb_build_object('kind', 'validation_error', 'field', 'courseId');
  end if;

  if p_code is null then
    return jsonb_build_object('kind', 'validation_error', 'field', 'code');
  end if;
  v_code := upper(trim(p_code));
  if v_code !~ '^[A-Z0-9/_-]{2,20}$' then
    return jsonb_build_object('kind', 'validation_error', 'field', 'code');
  end if;

  if p_name is null then
    return jsonb_build_object('kind', 'validation_error', 'field', 'name');
  end if;
  v_name := trim(p_name);
  if length(v_name) < 1 or length(v_name) > 200 then
    return jsonb_build_object('kind', 'validation_error', 'field', 'name');
  end if;

  -- Excludes the course's own current row from the duplicate check (ADM-02-R2).
  if exists (
    select 1 from public.courses where upper(trim(code)) = v_code and id <> p_course_id
  ) then
    return jsonb_build_object('kind', 'conflict_duplicate_code');
  end if;

  update public.courses
  set code = v_code, name = v_name, updated_at = now()
  where id = p_course_id
  returning is_active into v_is_active;

  if not found then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;

  return jsonb_build_object(
    'kind', 'success',
    'courseId', p_course_id, 'code', v_code, 'name', v_name, 'isActive', v_is_active
  );
exception
  when unique_violation then
    return jsonb_build_object('kind', 'conflict_duplicate_code');
  when lock_not_available or deadlock_detected or serialization_failure or query_canceled then
    return jsonb_build_object('kind', 'temporarily_unavailable', 'correlationId', gen_random_uuid());
end;
$$;

-- ---------------------------------------------------------------------------
-- ADM-02-R3/R8: deactivate/reactivate a course. Archive-over-delete: the row, every
-- dependent assignment, slot, and booking are left unchanged. No new read-side code is
-- needed for Student browse visibility -- browse_available_slots (20261018000000) already
-- joins "c.is_active", so this flip alone changes what it returns.
-- ---------------------------------------------------------------------------

create function public.admin_set_course_active(p_course_id uuid, p_active boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
set lock_timeout = '5s'
set statement_timeout = '10s'
as $$
declare
  v_is_active boolean;
begin
  if public.current_app_role() is distinct from 'admin'::public.app_role then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;

  if p_course_id is null then
    return jsonb_build_object('kind', 'validation_error', 'field', 'courseId');
  end if;

  if p_active is null then
    return jsonb_build_object('kind', 'validation_error', 'field', 'isActive');
  end if;

  update public.courses
  set is_active = p_active
  where id = p_course_id
  returning is_active into v_is_active;

  if not found then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;

  return jsonb_build_object('kind', 'success', 'courseId', p_course_id, 'isActive', v_is_active);
exception
  when lock_not_available or deadlock_detected or serialization_failure or query_canceled then
    return jsonb_build_object('kind', 'temporarily_unavailable', 'correlationId', gen_random_uuid());
end;
$$;

-- ---------------------------------------------------------------------------
-- ADM-02-R7/R8: list/search/filter courses with their current (active) lecturer(s).
-- Mirrors admin_list_accounts' shape: a security-definer RPC returning only allowlisted
-- fields, never a raw table read.
-- ---------------------------------------------------------------------------

create function public.admin_list_courses(
  p_query text default null,
  p_active boolean default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
set statement_timeout = '10s'
as $$
declare
  v_query text;
begin
  if public.current_app_role() is distinct from 'admin'::public.app_role then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;

  -- Defence in depth only: the app's zod schema already bounds and trims this before the RPC
  -- is ever called. A direct RPC call cannot send an unbounded pattern to ilike.
  v_query := nullif(left(trim(coalesce(p_query, '')), 200), '');

  return jsonb_build_object(
    'kind', 'success',
    'courses', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'code', c.code,
            'name', c.name,
            'isActive', c.is_active,
            'createdAt', c.created_at,
            'lecturers', coalesce(
              (
                select jsonb_agg(
                  jsonb_build_object(
                    'assignmentId', cl.id,
                    'lecturerId', cl.lecturer_id,
                    'lecturerName', lp.full_name
                  )
                  order by lp.full_name, cl.id
                )
                from public.course_lecturers cl
                join public.profiles lp on lp.id = cl.lecturer_id
                where cl.course_id = c.id and cl.is_active
              ),
              '[]'::jsonb
            )
          )
          order by c.code, c.id
        )
        from public.courses c
        where (p_active is null or c.is_active = p_active)
          and (
            v_query is null
            or c.code ilike '%' || v_query || '%'
            or c.name ilike '%' || v_query || '%'
          )
      ),
      '[]'::jsonb
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- ADM-02-R4/R8: assign an active lecturer-role account to an active course. The existing
-- course_lecturers_current_pair_idx partial unique index (20261018000000) is the concurrency
-- authority: this RPC pre-checks for a clean refusal, then maps a unique_violation from a true
-- race to the same conflict_duplicate_assignment.
-- ---------------------------------------------------------------------------

create function public.admin_assign_lecturer(p_course_id uuid, p_lecturer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
set lock_timeout = '5s'
set statement_timeout = '10s'
as $$
declare
  v_course public.courses%rowtype;
  v_lecturer public.profiles%rowtype;
  v_id uuid;
begin
  if public.current_app_role() is distinct from 'admin'::public.app_role then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;

  if p_course_id is null then
    return jsonb_build_object('kind', 'validation_error', 'field', 'courseId');
  end if;
  if p_lecturer_id is null then
    return jsonb_build_object('kind', 'validation_error', 'field', 'lecturerId');
  end if;

  select * into v_course from public.courses where id = p_course_id;
  if not found then
    return jsonb_build_object('kind', 'course_not_found');
  end if;
  if not v_course.is_active then
    return jsonb_build_object('kind', 'course_inactive');
  end if;

  select * into v_lecturer from public.profiles where id = p_lecturer_id;
  if not found then
    return jsonb_build_object('kind', 'lecturer_not_found');
  end if;
  if not v_lecturer.is_active then
    return jsonb_build_object('kind', 'lecturer_inactive');
  end if;
  if v_lecturer.role is distinct from 'lecturer'::public.app_role then
    return jsonb_build_object('kind', 'lecturer_wrong_role');
  end if;

  if exists (
    select 1 from public.course_lecturers
    where course_id = p_course_id and lecturer_id = p_lecturer_id and is_active
  ) then
    return jsonb_build_object('kind', 'conflict_duplicate_assignment');
  end if;

  insert into public.course_lecturers (course_id, lecturer_id, is_active)
  values (p_course_id, p_lecturer_id, true)
  returning id into v_id;

  return jsonb_build_object(
    'kind', 'success', 'assignmentId', v_id, 'courseId', p_course_id, 'lecturerId', p_lecturer_id
  );
exception
  when unique_violation then
    return jsonb_build_object('kind', 'conflict_duplicate_assignment');
  when lock_not_available or deadlock_detected or serialization_failure or query_canceled then
    return jsonb_build_object('kind', 'temporarily_unavailable', 'correlationId', gen_random_uuid());
end;
$$;

-- ---------------------------------------------------------------------------
-- ADM-02-R5/R8: remove (end) an assignment. Sets is_active/ended_at together in one update --
-- never a delete -- which is exactly the transition the existing
-- course_assignment_deactivation_notice trigger (20261020000000) listens for ("after update of
-- is_active ... when old.is_active and not new.is_active"), so removal continues to notify
-- affected approved bookings' student and lecturer without any new trigger.
-- ---------------------------------------------------------------------------

create function public.admin_remove_assignment(p_assignment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
set lock_timeout = '5s'
set statement_timeout = '10s'
as $$
begin
  if public.current_app_role() is distinct from 'admin'::public.app_role then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;

  if p_assignment_id is null then
    return jsonb_build_object('kind', 'validation_error', 'field', 'assignmentId');
  end if;

  -- Only a current (active) row is targeted: an unknown or already-non-current id matches
  -- zero rows and is refused the same way (ADM-02-R5).
  update public.course_lecturers
  set is_active = false, ended_at = now()
  where id = p_assignment_id and is_active;

  if not found then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;

  return jsonb_build_object('kind', 'success', 'assignmentId', p_assignment_id);
exception
  when lock_not_available or deadlock_detected or serialization_failure or query_canceled then
    return jsonb_build_object('kind', 'temporarily_unavailable', 'correlationId', gen_random_uuid());
end;
$$;

revoke all on function public.admin_create_course(text, text) from public, anon, authenticated;
revoke all on function public.admin_update_course(uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_set_course_active(uuid, boolean) from public, anon, authenticated;
revoke all on function public.admin_list_courses(text, boolean) from public, anon, authenticated;
revoke all on function public.admin_assign_lecturer(uuid, uuid) from public, anon, authenticated;
revoke all on function public.admin_remove_assignment(uuid) from public, anon, authenticated;

grant execute on function public.admin_create_course(text, text) to authenticated;
grant execute on function public.admin_update_course(uuid, text, text) to authenticated;
grant execute on function public.admin_set_course_active(uuid, boolean) to authenticated;
grant execute on function public.admin_list_courses(text, boolean) to authenticated;
grant execute on function public.admin_assign_lecturer(uuid, uuid) to authenticated;
grant execute on function public.admin_remove_assignment(uuid) to authenticated;

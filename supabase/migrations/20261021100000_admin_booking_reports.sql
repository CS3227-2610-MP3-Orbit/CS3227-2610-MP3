-- ADM-04: database layer for the administrator booking report and its AI activity summary.
-- Two independent pieces, append-only (no existing migration is edited):
--   1. admin_get_booking_report: a new, admin-only, read-only aggregate RPC (R2/R3/R4/R9).
--   2. claim_ai_attempt is re-created (R10) to also admit "admin.activity-summary" and LEC-04's
--      "lecturer.ai-briefing", keeping the STU-05 single shared 100-per-SGT-day count, advisory
--      lock, and in-flight guard unchanged. This migration is the single owner of the allowlist:
--      any later re-creation must keep every feature listed here.

-- ---------------------------------------------------------------------------
-- ADM-04-R2/R3/R4/R9: admin_get_booking_report. Counts and catalogue labels only -- never a
-- student id/name/topic/questions/rejection_reason, matching ADM-02's admin_list_courses
-- read-only RPC shape. A booking is counted by its slot's starts_at SGT day (owner decision a),
-- not the booking's own created_at. byStatus is zero-filled across all 5 booking_status values;
-- byCourse/byLecturer list only rows with >=1 booking (owner decision b); byDay is zero-filled
-- for every SGT day in the range, ascending.
-- ---------------------------------------------------------------------------

create function public.admin_get_booking_report(p_start_date text, p_end_date text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
set statement_timeout = '10s'
as $$
declare
  v_start_date date;
  v_end_date date;
  v_start_ts timestamptz;
  v_end_ts timestamptz;
begin
  if public.current_app_role() is distinct from 'admin'::public.app_role then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;

  if p_start_date is null or p_start_date !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    return jsonb_build_object('kind', 'validation_error', 'field', 'startDate');
  end if;
  begin
    v_start_date := p_start_date::date;
  exception when others then
    return jsonb_build_object('kind', 'validation_error', 'field', 'startDate');
  end;
  if to_char(v_start_date, 'YYYY-MM-DD') <> p_start_date then
    return jsonb_build_object('kind', 'validation_error', 'field', 'startDate');
  end if;

  if p_end_date is null or p_end_date !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    return jsonb_build_object('kind', 'validation_error', 'field', 'endDate');
  end if;
  begin
    v_end_date := p_end_date::date;
  exception when others then
    return jsonb_build_object('kind', 'validation_error', 'field', 'endDate');
  end;
  if to_char(v_end_date, 'YYYY-MM-DD') <> p_end_date then
    return jsonb_build_object('kind', 'validation_error', 'field', 'endDate');
  end if;

  -- ADM-04-R1/R2: end >= start and a span of at most 92 SGT days (inclusive of both ends).
  if v_end_date < v_start_date or (v_end_date - v_start_date) > 91 then
    return jsonb_build_object('kind', 'validation_error', 'field', 'range');
  end if;

  -- Same SGT-midnight-to-midnight pattern as browse_available_slots' own single-day filter
  -- (20261018000000), extended to a half-open range covering every day from start to end.
  v_start_ts := v_start_date::timestamp at time zone 'Asia/Singapore';
  v_end_ts := (v_end_date + 1)::timestamp at time zone 'Asia/Singapore';

  return jsonb_build_object(
    'kind', 'success',
    'startDate', to_char(v_start_date, 'YYYY-MM-DD'),
    'endDate', to_char(v_end_date, 'YYYY-MM-DD'),
    'totalBookings', (
      select count(*) from public.bookings b
      join public.consultation_slots s on s.id = b.slot_id
      where s.starts_at >= v_start_ts and s.starts_at < v_end_ts
    ),
    'byStatus', (
      select jsonb_agg(
        jsonb_build_object('status', statuses.status_value, 'count', coalesce(counted.cnt, 0))
        order by statuses.ord
      )
      from (
        values ('pending', 1), ('approved', 2), ('rejected', 3), ('cancelled', 4), ('completed', 5)
      ) as statuses(status_value, ord)
      left join (
        select b.status::text as status_value, count(*) as cnt
        from public.bookings b
        join public.consultation_slots s on s.id = b.slot_id
        where s.starts_at >= v_start_ts and s.starts_at < v_end_ts
        group by b.status
      ) counted using (status_value)
    ),
    'byCourse', coalesce((
      select jsonb_agg(
        jsonb_build_object('courseId', c.id, 'code', c.code, 'name', c.name, 'count', counted.cnt)
        order by c.code, c.id
      )
      from (
        select s.course_id, count(*) as cnt
        from public.bookings b
        join public.consultation_slots s on s.id = b.slot_id
        where s.starts_at >= v_start_ts and s.starts_at < v_end_ts
        group by s.course_id
      ) counted
      join public.courses c on c.id = counted.course_id
    ), '[]'::jsonb),
    'byLecturer', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'lecturerId', p.id, 'lecturerName', p.full_name, 'count', counted.cnt
        )
        order by p.full_name, p.id
      )
      from (
        select s.lecturer_id, count(*) as cnt
        from public.bookings b
        join public.consultation_slots s on s.id = b.slot_id
        where s.starts_at >= v_start_ts and s.starts_at < v_end_ts
        group by s.lecturer_id
      ) counted
      join public.profiles p on p.id = counted.lecturer_id
    ), '[]'::jsonb),
    'byDay', (
      select jsonb_agg(
        jsonb_build_object('date', to_char(day_series.d, 'YYYY-MM-DD'), 'count', coalesce(counted.cnt, 0))
        order by day_series.d
      )
      from (
        select generate_series(v_start_date::timestamp, v_end_date::timestamp, interval '1 day')::date as d
      ) as day_series
      left join (
        select (s.starts_at at time zone 'Asia/Singapore')::date as d, count(*) as cnt
        from public.bookings b
        join public.consultation_slots s on s.id = b.slot_id
        where s.starts_at >= v_start_ts and s.starts_at < v_end_ts
        group by (s.starts_at at time zone 'Asia/Singapore')::date
      ) counted using (d)
    )
  );
end;
$$;

revoke all on function public.admin_get_booking_report(text, text) from public, anon, authenticated;
grant execute on function public.admin_get_booking_report(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- ADM-04-R10: re-create claim_ai_attempt (exactly as 20261020030000_student_improve_request_
-- daily_quota.sql) to also admit "admin.activity-summary" and "lecturer.ai-briefing" (LEC-04,
-- #33, which calls generateText with that feature but adds no allowlist migration). Everything else -- the single shared
-- 100-per-SGT-day count across every admitted feature, the advisory lock, the per-user in-flight
-- guard, and the refusal of every other feature name -- is unchanged.
-- ---------------------------------------------------------------------------

create or replace function public.claim_ai_attempt(p_user_id uuid, p_feature text) returns jsonb
language plpgsql security definer set search_path = ''
set lock_timeout = '5s' set statement_timeout = '10s' as $$
declare
  v_now timestamptz := clock_timestamp();
  v_day date := (v_now at time zone 'Asia/Singapore')::date;
  v_global_day integer;
  v_pending_since timestamptz;
  v_attempt_id bigint;
begin
  if p_user_id is null
    or p_feature not in ('student.improve-request', 'admin.activity-summary', 'lecturer.ai-briefing')
  then
    return jsonb_build_object('kind', 'unavailable');
  end if;

  perform pg_advisory_xact_lock(hashtext('public.ai_usage.student-improve-request'));
  update public.ai_usage
  set state = 'expired', resolved_at = v_now
  where state in ('pending', 'indeterminate')
    and created_at < v_now - interval '2 minutes';

  select min(created_at) into v_pending_since
  from public.ai_usage
  where user_id = p_user_id and feature = p_feature and state in ('pending', 'indeterminate');
  if v_pending_since is not null then
    return jsonb_build_object('kind', 'in_flight');
  end if;

  -- Pending reservations prevent concurrent admissions exceeding the successful-response budget.
  select count(*) into v_global_day from public.ai_usage
  where admission_day = v_day and state in ('pending', 'succeeded');
  if v_global_day >= 100 then
    return jsonb_build_object('kind', 'quota_exceeded', 'retryAfterSeconds', 60);
  end if;

  insert into public.ai_usage (user_id, feature, state, admission_day)
  values (p_user_id, p_feature, 'pending', v_day)
  returning id into v_attempt_id;
  return jsonb_build_object('kind', 'admitted', 'attemptId', v_attempt_id);
exception when unique_violation then
  return jsonb_build_object('kind', 'in_flight');
when lock_not_available or deadlock_detected or serialization_failure or query_canceled then
  return jsonb_build_object('kind', 'unavailable');
end;
$$;

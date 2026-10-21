-- ADM-04-R11: count an approved booking whose slot has ended as "completed" in byStatus.
-- LEC-03-R4 made completion display-derived (the stored status stays 'approved'), so counting
-- the stored status alone always reported 0 completed. Re-creates admin_get_booking_report
-- from 20261021100000 with only the byStatus grouping changed; signature, admin check,
-- validation, minimization and grants are unchanged. No booking row is written.

create or replace function public.admin_get_booking_report(p_start_date text, p_end_date text)
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
        -- ADM-04-R11: LEC-03's display rule (20261020000000); now() keeps the function STABLE.
        select
          case
            when b.status = 'approved' and now() >= s.ends_at then 'completed'
            else b.status::text
          end as status_value,
          count(*) as cnt
        from public.bookings b
        join public.consultation_slots s on s.id = b.slot_id
        where s.starts_at >= v_start_ts and s.starts_at < v_end_ts
        group by 1
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

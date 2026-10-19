-- STU-01 read model: shared course/assignment/slot/booking data and the only
-- authenticated Student browse projection. Mutation policies intentionally remain
-- absent until their role specifications are approved and implemented.

create extension if not exists pgcrypto with schema extensions;

create type public.booking_status as enum (
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'completed'
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null check (length(trim(code)) > 0),
  name text not null check (length(trim(name)) > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index courses_active_idx on public.courses (id) where is_active;

create table public.course_lecturers (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete restrict,
  lecturer_id uuid not null references public.profiles (id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  check ((is_active and ended_at is null) or (not is_active))
);

create unique index course_lecturers_current_pair_idx
  on public.course_lecturers (course_id, lecturer_id)
  where is_active;
create index course_lecturers_lecturer_active_idx
  on public.course_lecturers (lecturer_id, course_id)
  where is_active;

create function public.enforce_current_course_lecturer_endpoints()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_active and (
    not exists (
      select 1
      from public.courses c
      where c.id = new.course_id and c.is_active
    )
    or not exists (
      select 1
      from public.profiles p
      where p.id = new.lecturer_id
        and p.is_active
        and p.role = 'lecturer'::public.app_role
    )
  ) then
    raise exception using
      errcode = '23514',
      message = 'current lecturer-course assignment requires active endpoints';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_current_course_lecturer_endpoints() from public, anon, authenticated;

create trigger course_lecturers_current_endpoints
  before insert or update of course_id, lecturer_id, is_active
  on public.course_lecturers
  for each row execute function public.enforce_current_course_lecturer_endpoints();

create table public.consultation_slots (
  id uuid primary key default gen_random_uuid(),
  lecturer_id uuid not null references public.profiles (id) on delete restrict,
  course_id uuid not null references public.courses (id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index consultation_slots_browse_idx
  on public.consultation_slots (starts_at, id, course_id, lecturer_id);
create index consultation_slots_lecturer_time_idx
  on public.consultation_slots (lecturer_id, starts_at, ends_at);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.consultation_slots (id) on delete restrict,
  student_id uuid not null references public.profiles (id) on delete restrict,
  status public.booking_status not null default 'pending',
  topic text not null,
  questions text not null default '',
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'rejected' or length(trim(coalesce(rejection_reason, ''))) > 0)
);

create unique index bookings_one_active_reservation_per_slot_idx
  on public.bookings (slot_id)
  where status in ('pending', 'approved');
create index bookings_slot_status_idx on public.bookings (slot_id, status);
create index bookings_student_status_idx on public.bookings (student_id, status);

alter table public.courses enable row level security;
alter table public.course_lecturers enable row level security;
alter table public.consultation_slots enable row level security;
alter table public.bookings enable row level security;

revoke all on table public.courses from anon, authenticated;
revoke all on table public.course_lecturers from anon, authenticated;
revoke all on table public.consultation_slots from anon, authenticated;
revoke all on table public.bookings from anon, authenticated;

-- A randomly generated, database-local signing key prevents clients from altering
-- or rebinding pagination cursors. It is neither in application configuration nor
-- exposed through the API schemas.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.student_slot_cursor_key (
  singleton boolean primary key default true check (singleton),
  secret bytea not null
);

insert into private.student_slot_cursor_key (secret)
values (extensions.gen_random_bytes(32));

revoke all on table private.student_slot_cursor_key from public, anon, authenticated;

create function public.browse_available_slots(
  p_lecturer_id text default null,
  p_course_id text default null,
  p_date text default null,
  p_cursor text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := statement_timestamp();
  v_lecturer_id uuid;
  v_course_id uuid;
  v_date date;
  v_date_start timestamptz;
  v_date_end timestamptz;
  v_cursor_starts_at timestamptz;
  v_cursor_slot_id uuid;
  v_cursor_payload jsonb;
  v_payload_part text;
  v_signature_part text;
  v_expected_signature text;
  v_cursor_key bytea;
  v_slots jsonb;
  v_courses jsonb;
  v_lecturers jsonb;
  v_page_count bigint;
  v_last_starts_at timestamptz;
  v_last_slot_id uuid;
  v_next_payload jsonb;
  v_next_payload_part text;
  v_next_signature text;
  v_next_cursor text;
begin
  if public.current_app_role() is distinct from 'student'::public.app_role then
    return jsonb_build_object('status', 'forbidden_or_not_found');
  end if;

  if coalesce(length(p_lecturer_id), 0) + coalesce(length(p_course_id), 0)
      + coalesce(length(p_date), 0) + coalesce(length(p_cursor), 0) > 2048 then
    return jsonb_build_object('status', 'validation_error', 'field', 'query');
  end if;

  if p_lecturer_id is not null then
    if p_lecturer_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      return jsonb_build_object('status', 'validation_error', 'field', 'lecturerId');
    end if;
    v_lecturer_id := p_lecturer_id::uuid;
  end if;

  if p_course_id is not null then
    if p_course_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      return jsonb_build_object('status', 'validation_error', 'field', 'courseId');
    end if;
    v_course_id := p_course_id::uuid;
  end if;

  if p_date is not null then
    if p_date !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
      return jsonb_build_object('status', 'validation_error', 'field', 'date');
    end if;
    begin
      v_date := p_date::date;
    exception when others then
      return jsonb_build_object('status', 'validation_error', 'field', 'date');
    end;
    if to_char(v_date, 'YYYY-MM-DD') <> p_date then
      return jsonb_build_object('status', 'validation_error', 'field', 'date');
    end if;
    v_date_start := v_date::timestamp at time zone 'Asia/Singapore';
    v_date_end := (v_date + 1)::timestamp at time zone 'Asia/Singapore';
  end if;

  if p_cursor is not null then
    if length(p_cursor) > 512 or p_cursor !~ '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$' then
      return jsonb_build_object('status', 'validation_error', 'field', 'cursor');
    end if;

    begin
      v_payload_part := split_part(p_cursor, '.', 1);
      v_signature_part := split_part(p_cursor, '.', 2);
      v_cursor_payload := convert_from(
        decode(
          translate(v_payload_part, '-_', '+/')
            || repeat('=', (4 - length(v_payload_part) % 4) % 4),
          'base64'
        ),
        'UTF8'
      )::jsonb;
      select secret into strict v_cursor_key from private.student_slot_cursor_key where singleton;
      v_expected_signature := rtrim(
        translate(
          regexp_replace(
            encode(extensions.hmac(convert_to(v_payload_part, 'UTF8'), v_cursor_key, 'sha256'), 'base64'),
            '[[:space:]]',
            '',
            'g'
          ),
          '+/',
          '-_'
        ),
        '='
      );

      if v_signature_part <> v_expected_signature
        or v_cursor_payload ->> 'version' <> '1'
        or (v_cursor_payload ->> 'lecturerId') is distinct from p_lecturer_id
        or (v_cursor_payload ->> 'courseId') is distinct from p_course_id
        or (v_cursor_payload ->> 'date') is distinct from p_date then
        return jsonb_build_object('status', 'validation_error', 'field', 'cursor');
      end if;

      v_cursor_starts_at := (v_cursor_payload ->> 'startsAt')::timestamptz;
      v_cursor_slot_id := (v_cursor_payload ->> 'slotId')::uuid;
    exception when others then
      return jsonb_build_object('status', 'validation_error', 'field', 'cursor');
    end;

    if not exists (
      select 1
      from public.consultation_slots s
      join public.courses c on c.id = s.course_id and c.is_active
      join public.profiles p on p.id = s.lecturer_id and p.is_active and p.role = 'lecturer'
      join public.course_lecturers cl
        on cl.course_id = s.course_id and cl.lecturer_id = s.lecturer_id and cl.is_active
      where s.id = v_cursor_slot_id
        and s.starts_at = v_cursor_starts_at
        and s.starts_at > v_now
        and s.ends_at > s.starts_at
        and (v_lecturer_id is null or s.lecturer_id = v_lecturer_id)
        and (v_course_id is null or s.course_id = v_course_id)
        and (v_date_start is null or (s.starts_at >= v_date_start and s.starts_at < v_date_end))
        and not exists (
          select 1 from public.bookings b
          where b.slot_id = s.id and b.status in ('pending', 'approved', 'completed')
        )
    ) then
      return jsonb_build_object('status', 'validation_error', 'field', 'cursor');
    end if;
  end if;

  with eligible as (
    select
      s.id as slot_id,
      s.course_id,
      c.code as course_code,
      c.name as course_name,
      s.lecturer_id,
      p.full_name as lecturer_name,
      s.starts_at,
      s.ends_at
    from public.consultation_slots s
    join public.courses c on c.id = s.course_id and c.is_active
    join public.profiles p on p.id = s.lecturer_id and p.is_active and p.role = 'lecturer'
    join public.course_lecturers cl
      on cl.course_id = s.course_id and cl.lecturer_id = s.lecturer_id and cl.is_active
    where s.starts_at > v_now
      and s.ends_at > s.starts_at
      and (v_lecturer_id is null or s.lecturer_id = v_lecturer_id)
      and (v_course_id is null or s.course_id = v_course_id)
      and (v_date_start is null or (s.starts_at >= v_date_start and s.starts_at < v_date_end))
      and (
        v_cursor_starts_at is null
        or (s.starts_at, s.id) > (v_cursor_starts_at, v_cursor_slot_id)
      )
      and not exists (
        select 1 from public.bookings b
        where b.slot_id = s.id and b.status in ('pending', 'approved', 'completed')
      )
    order by s.starts_at, s.id
    limit 21
  ), numbered as (
    select eligible.*, row_number() over (order by starts_at, slot_id) as row_number
    from eligible
  )
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'slotId', slot_id,
          'courseId', course_id,
          'courseCode', course_code,
          'courseName', course_name,
          'lecturerId', lecturer_id,
          'lecturerName', lecturer_name,
          'startsAt', to_char(starts_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
          'endsAt', to_char(ends_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
        ) order by starts_at, slot_id
      ) filter (where row_number <= 20),
      '[]'::jsonb
    ),
    count(*),
    max(starts_at) filter (where row_number = 20),
    (max(slot_id::text) filter (where row_number = 20))::uuid
  into v_slots, v_page_count, v_last_starts_at, v_last_slot_id
  from numbered;

  if v_page_count > 20 then
    v_next_payload := jsonb_build_object(
      'version', 1,
      'startsAt', to_char(v_last_starts_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
      'slotId', v_last_slot_id,
      'lecturerId', p_lecturer_id,
      'courseId', p_course_id,
      'date', p_date
    );
    v_next_payload_part := rtrim(
      translate(
        regexp_replace(
          encode(convert_to(v_next_payload::text, 'UTF8'), 'base64'),
          '[[:space:]]',
          '',
          'g'
        ),
        '+/',
        '-_'
      ),
      '='
    );
    if v_cursor_key is null then
      select secret into strict v_cursor_key from private.student_slot_cursor_key where singleton;
    end if;
    v_next_signature := rtrim(
      translate(
        regexp_replace(
          encode(extensions.hmac(convert_to(v_next_payload_part, 'UTF8'), v_cursor_key, 'sha256'), 'base64'),
          '[[:space:]]',
          '',
          'g'
        ),
        '+/',
        '-_'
      ),
      '='
    );
    v_next_cursor := v_next_payload_part || '.' || v_next_signature;
  end if;

  with visible as (
    select distinct c.id, c.code, c.name
    from public.consultation_slots s
    join public.courses c on c.id = s.course_id and c.is_active
    join public.profiles p on p.id = s.lecturer_id and p.is_active and p.role = 'lecturer'
    join public.course_lecturers cl
      on cl.course_id = s.course_id and cl.lecturer_id = s.lecturer_id and cl.is_active
    where s.starts_at > v_now
      and s.ends_at > s.starts_at
      and not exists (
        select 1 from public.bookings b
        where b.slot_id = s.id and b.status in ('pending', 'approved', 'completed')
      )
  )
  select coalesce(
    jsonb_agg(jsonb_build_object('id', id, 'code', code, 'name', name) order by code, id),
    '[]'::jsonb
  ) into v_courses
  from visible;

  with visible as (
    select distinct p.id, p.full_name
    from public.consultation_slots s
    join public.courses c on c.id = s.course_id and c.is_active
    join public.profiles p on p.id = s.lecturer_id and p.is_active and p.role = 'lecturer'
    join public.course_lecturers cl
      on cl.course_id = s.course_id and cl.lecturer_id = s.lecturer_id and cl.is_active
    where s.starts_at > v_now
      and s.ends_at > s.starts_at
      and not exists (
        select 1 from public.bookings b
        where b.slot_id = s.id and b.status in ('pending', 'approved', 'completed')
      )
  )
  select coalesce(
    jsonb_agg(jsonb_build_object('id', id, 'name', full_name) order by full_name, id),
    '[]'::jsonb
  ) into v_lecturers
  from visible;

  return jsonb_build_object(
    'status', 'success',
    'slots', v_slots,
    'courses', v_courses,
    'lecturers', v_lecturers,
    'nextCursor', v_next_cursor
  );
end;
$$;

revoke all on function public.browse_available_slots(text, text, text, text) from public, anon;
grant execute on function public.browse_available_slots(text, text, text, text) to authenticated;

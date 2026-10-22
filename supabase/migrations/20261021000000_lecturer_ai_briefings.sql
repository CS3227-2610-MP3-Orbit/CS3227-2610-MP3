-- LEC-04: retained AI briefings for the owning Lecturer.
create table public.lecturer_ai_briefings (
  id uuid primary key default gen_random_uuid(),
  lecturer_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  content text not null check (length(trim(content)) > 0 and length(content) <= 12000),
  created_at timestamptz not null default now()
);

alter table public.lecturer_ai_briefings enable row level security;

create policy "lecturers read own AI briefings"
  on public.lecturer_ai_briefings for select to authenticated
  using (lecturer_id = auth.uid());

create policy "lecturers create own AI briefings"
  on public.lecturer_ai_briefings for insert to authenticated
  with check (lecturer_id = auth.uid());

drop policy "lecturers read own AI briefings" on public.lecturer_ai_briefings;
create policy "active lecturers read own AI briefings"
  on public.lecturer_ai_briefings for select to authenticated
  using (
    lecturer_id = auth.uid()
    and public.current_app_role() = 'lecturer'
  );

drop policy "lecturers create own AI briefings" on public.lecturer_ai_briefings;
create policy "active lecturers create own AI briefings"
  on public.lecturer_ai_briefings for insert to authenticated
  with check (
    lecturer_id = auth.uid()
    and public.current_app_role() = 'lecturer'
    and exists (
      select 1
      from public.bookings b
      join public.consultation_slots s on s.id = b.slot_id
      where b.id = booking_id
        and s.lecturer_id = auth.uid()
        and b.status = 'approved'
    )
  );

revoke update, delete on public.lecturer_ai_briefings from anon, authenticated;
grant select, insert on public.lecturer_ai_briefings to authenticated;

create index lecturer_ai_briefings_lecturer_created_idx
  on public.lecturer_ai_briefings (lecturer_id, created_at desc);

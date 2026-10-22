-- LEC-01: return only active courses assigned to the authenticated lecturer.
create or replace function public.list_lecturer_courses()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_rows jsonb;
begin
  if public.current_app_role() <> 'lecturer'::public.app_role then
    return jsonb_build_object('kind', 'forbidden_or_not_found', 'courses', '[]'::jsonb);
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object('id', c.id, 'code', c.code, 'name', c.name)
      order by c.code
    ),
    '[]'::jsonb
  )
  into v_rows
  from public.courses c
  join public.course_lecturers cl on cl.course_id = c.id
  where cl.lecturer_id = auth.uid()
    and cl.is_active
    and c.is_active;

  return jsonb_build_object('kind', 'success', 'courses', v_rows);
end;
$$;

revoke all on function public.list_lecturer_courses() from public, anon, authenticated;
grant execute on function public.list_lecturer_courses() to authenticated;


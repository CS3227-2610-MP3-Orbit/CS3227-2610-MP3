-- ADM-03: database layer for administrator-published guidelines and announcements. One new
-- table (append-only; no row is ever deleted), two RLS select policies (the same "profiles"
-- admin-reads-all / active-users-read-X shape), and three new security-definer write RPCs.
-- The admin list (R4) and the reader projection (R5/R9) are deliberately NOT RPCs: both read
-- this table directly through RLS from the app (src/features/admin/announcements/server.ts and
-- src/features/shared/announcements/server.ts), the same "revoke all, then grant select only to
-- authenticated" shape 20261020000000's in_app_notifications and 20261021000000's
-- lecturer_ai_briefings already use, rather than a fourth/fifth RPC -- keeping this feature's
-- database surface to exactly three new functions, per the approved spec's technical proposal.

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('guideline', 'announcement')),
  title text not null check (length(trim(title)) between 1 and 120),
  body text not null check (length(trim(body)) between 1 and 2000),
  is_published boolean not null default false,
  created_by uuid not null references public.profiles (id) on delete restrict,
  updated_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ADM-03-R4: the admin list reads every row, newest-first. ADM-03-R9: the reader projection
-- reads only published rows, newest-first, with the announcement half capped to 5 -- one index
-- serves both access patterns.
create index announcements_created_idx on public.announcements (created_at desc, id desc);
create index announcements_published_kind_created_idx
  on public.announcements (is_published, kind, created_at desc)
  where is_published;

alter table public.announcements enable row level security;

-- ADM-03-R6: clean slate first. insert/update/delete stay revoked from both anon and
-- authenticated (no policy for any of the three exists either, so this is defense-in-depth, not
-- the only barrier) -- every write can only happen through the three RPCs below. select is
-- granted back to authenticated only, so the two policies created next actually run for a real
-- session instead of being shadowed by a missing table-level grant.
revoke all on table public.announcements from anon, authenticated;
grant select on public.announcements to authenticated;

-- ADM-03-R4: the admin list's own access path -- no seventh/fourth RPC needed for this read.
create policy "announcements: admin reads all" on public.announcements
  for select to authenticated
  using ((select public.current_app_role()) = 'admin');

-- ADM-03-R5: any active signed-in user (any role) reads only published rows; current_app_role()
-- is null for a signed-out or deactivated caller, matching no policy at all (ADM-03-R5/R-15,
-- the UC5 deactivation edge case).
create policy "announcements: active users read published" on public.announcements
  for select to authenticated
  using ((select public.current_app_role()) is not null and is_published);

-- ---------------------------------------------------------------------------
-- ADM-03-R1/R6: create a guideline or announcement. Always starts as a draft
-- (is_published = false); publishing it is a separate, deliberate action (R3).
-- ---------------------------------------------------------------------------

create function public.admin_create_announcement(p_kind text, p_title text, p_body text)
returns jsonb
language plpgsql
security definer
set search_path = ''
set lock_timeout = '5s'
set statement_timeout = '10s'
as $$
declare
  v_kind text;
  v_title text;
  v_body text;
  v_actor uuid;
  v_id uuid;
  v_created_at timestamptz;
begin
  if public.current_app_role() is distinct from 'admin'::public.app_role then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;
  v_actor := (select auth.uid());

  if p_kind is null or p_kind not in ('guideline', 'announcement') then
    return jsonb_build_object('kind', 'validation_error', 'field', 'kind');
  end if;
  v_kind := p_kind;

  if p_title is null then
    return jsonb_build_object('kind', 'validation_error', 'field', 'title');
  end if;
  v_title := trim(p_title);
  if length(v_title) < 1 or length(v_title) > 120 then
    return jsonb_build_object('kind', 'validation_error', 'field', 'title');
  end if;

  if p_body is null then
    return jsonb_build_object('kind', 'validation_error', 'field', 'body');
  end if;
  v_body := trim(p_body);
  if length(v_body) < 1 or length(v_body) > 2000 then
    return jsonb_build_object('kind', 'validation_error', 'field', 'body');
  end if;

  insert into public.announcements (kind, title, body, is_published, created_by, updated_by)
  values (v_kind, v_title, v_body, false, v_actor, v_actor)
  returning id, created_at into v_id, v_created_at;

  return jsonb_build_object(
    'kind', 'success',
    'id', v_id,
    'announcementKind', v_kind,
    'title', v_title,
    'body', v_body,
    'isPublished', false,
    'createdAt', v_created_at,
    'updatedAt', v_created_at
  );
exception
  when lock_not_available or deadlock_detected or serialization_failure or query_canceled then
    return jsonb_build_object('kind', 'temporarily_unavailable', 'correlationId', gen_random_uuid());
end;
$$;

-- ---------------------------------------------------------------------------
-- ADM-03-R2/R6: edit an existing item's kind/title/body. Never touches is_published (that is
-- R3's separate action below). An unknown id is refused.
-- ---------------------------------------------------------------------------

create function public.admin_update_announcement(p_id uuid, p_kind text, p_title text, p_body text)
returns jsonb
language plpgsql
security definer
set search_path = ''
set lock_timeout = '5s'
set statement_timeout = '10s'
as $$
declare
  v_kind text;
  v_title text;
  v_body text;
  v_actor uuid;
  v_is_published boolean;
  v_updated_at timestamptz;
begin
  if public.current_app_role() is distinct from 'admin'::public.app_role then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;
  v_actor := (select auth.uid());

  if p_id is null then
    return jsonb_build_object('kind', 'validation_error', 'field', 'id');
  end if;

  if p_kind is null or p_kind not in ('guideline', 'announcement') then
    return jsonb_build_object('kind', 'validation_error', 'field', 'kind');
  end if;
  v_kind := p_kind;

  if p_title is null then
    return jsonb_build_object('kind', 'validation_error', 'field', 'title');
  end if;
  v_title := trim(p_title);
  if length(v_title) < 1 or length(v_title) > 120 then
    return jsonb_build_object('kind', 'validation_error', 'field', 'title');
  end if;

  if p_body is null then
    return jsonb_build_object('kind', 'validation_error', 'field', 'body');
  end if;
  v_body := trim(p_body);
  if length(v_body) < 1 or length(v_body) > 2000 then
    return jsonb_build_object('kind', 'validation_error', 'field', 'body');
  end if;

  update public.announcements
  set kind = v_kind, title = v_title, body = v_body, updated_by = v_actor, updated_at = now()
  where id = p_id
  returning is_published, updated_at into v_is_published, v_updated_at;

  if not found then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;

  return jsonb_build_object(
    'kind', 'success',
    'id', p_id,
    'announcementKind', v_kind,
    'title', v_title,
    'body', v_body,
    'isPublished', v_is_published,
    'updatedAt', v_updated_at
  );
exception
  when lock_not_available or deadlock_detected or serialization_failure or query_canceled then
    return jsonb_build_object('kind', 'temporarily_unavailable', 'correlationId', gen_random_uuid());
end;
$$;

-- ---------------------------------------------------------------------------
-- ADM-03-R3/R6: publish/unpublish. Archive-over-delete: the row, its created_by/created_at and
-- its full edit history's latest state are always preserved -- there is no delete operation
-- anywhere in this feature's RPCs, UI, or database grants.
-- ---------------------------------------------------------------------------

create function public.admin_set_announcement_published(p_id uuid, p_published boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
set lock_timeout = '5s'
set statement_timeout = '10s'
as $$
declare
  v_actor uuid;
  v_is_published boolean;
begin
  if public.current_app_role() is distinct from 'admin'::public.app_role then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;
  v_actor := (select auth.uid());

  if p_id is null then
    return jsonb_build_object('kind', 'validation_error', 'field', 'id');
  end if;
  if p_published is null then
    return jsonb_build_object('kind', 'validation_error', 'field', 'isPublished');
  end if;

  update public.announcements
  set is_published = p_published, updated_by = v_actor, updated_at = now()
  where id = p_id
  returning is_published into v_is_published;

  if not found then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;

  return jsonb_build_object('kind', 'success', 'id', p_id, 'isPublished', v_is_published);
exception
  when lock_not_available or deadlock_detected or serialization_failure or query_canceled then
    return jsonb_build_object('kind', 'temporarily_unavailable', 'correlationId', gen_random_uuid());
end;
$$;

revoke all on function public.admin_create_announcement(text, text, text) from public, anon, authenticated;
revoke all on function public.admin_update_announcement(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.admin_set_announcement_published(uuid, boolean) from public, anon, authenticated;

grant execute on function public.admin_create_announcement(text, text, text) to authenticated;
grant execute on function public.admin_update_announcement(uuid, text, text, text) to authenticated;
grant execute on function public.admin_set_announcement_published(uuid, boolean) to authenticated;

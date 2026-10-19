-- ADM-01: database layer for admin account management (role changes, activate/deactivate,
-- the protected recovery administrator). No direct table writes from the app; role and
-- active-state changes go through the two RPCs below only.

-- ---------------------------------------------------------------------------
-- ADM-01-R8: protected recovery administrator
-- ---------------------------------------------------------------------------

-- At most one profile may ever be the protected recovery administrator. The partial
-- unique index indexes only rows where is_protected is true, so a second true row
-- collides with the first; false rows are never indexed, so there is no limit on them.
alter table public.profiles add column is_protected boolean not null default false;

create unique index profiles_protected_singleton_idx
  on public.profiles (is_protected)
  where is_protected;

-- Mark the environment's earliest-created active admin as protected, if one exists and
-- none is marked yet. Ties break on id for a deterministic choice per environment.
-- This runs once, at migration time, exactly as ADM-01-R8 requires: the application and
-- the RPCs below never set or clear this flag.
do $$
declare
  v_admin_id uuid;
begin
  if not exists (select 1 from public.profiles where is_protected) then
    select id into v_admin_id
    from public.profiles
    where role = 'admin' and is_active
    order by created_at, id
    limit 1;

    if v_admin_id is not null then
      update public.profiles set is_protected = true where id = v_admin_id;
    end if;
  end if;
end;
$$;

-- No authenticated/anon role may write profiles directly any more: role, is_active, and
-- is_protected all change only through admin_set_role/admin_set_active (which run as the
-- function owner and so are unaffected by this revoke) or a maintainer's migration/script.
drop policy "profiles: admin updates" on public.profiles;
revoke update on table public.profiles from anon, authenticated;

-- ---------------------------------------------------------------------------
-- ADM-01-R3/R4/R5/R7/R8: admin-only role and active-state RPCs
-- ---------------------------------------------------------------------------

-- Changes another user's role. Refuses the caller's own account (R5), the protected
-- recovery administrator as a target (R8), an unknown target, and any change that would
-- leave zero active administrators (R7). pg_advisory_xact_lock serializes every call to
-- either RPC in this migration on one fixed key, so two admins concurrently demoting or
-- deactivating each other cannot both pass the zero-admin check: the second call waits
-- for the first transaction to finish, then re-reads the now-current admin count.
create function public.admin_set_role(target_id uuid, new_role public.app_role)
returns jsonb
language plpgsql
security definer
set search_path = ''
set lock_timeout = '5s'
set statement_timeout = '10s'
as $$
declare
  v_target public.profiles%rowtype;
  v_other_active_admins bigint;
  v_resulting_active_admins bigint;
begin
  if public.current_app_role() is distinct from 'admin'::public.app_role then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;

  if target_id is null then
    return jsonb_build_object('kind', 'validation_error', 'field', 'targetId');
  end if;

  -- Refused regardless of the requested value (even a malformed one), before any
  -- lookup or field validation that could disclose anything about the target.
  if target_id = (select auth.uid()) then
    return jsonb_build_object('kind', 'forbidden_self_change');
  end if;

  if new_role is null then
    return jsonb_build_object('kind', 'validation_error', 'field', 'role');
  end if;

  perform pg_advisory_xact_lock(82010001);

  select * into v_target from public.profiles where id = target_id for update;
  if not found then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;

  if v_target.is_protected then
    return jsonb_build_object('kind', 'forbidden_protected');
  end if;

  select count(*) into v_other_active_admins
  from public.profiles
  where role = 'admin' and is_active and id <> target_id;

  v_resulting_active_admins := v_other_active_admins
    + (case when new_role = 'admin' and v_target.is_active then 1 else 0 end);

  if v_resulting_active_admins = 0 then
    return jsonb_build_object('kind', 'forbidden_zero_admins');
  end if;

  update public.profiles set role = new_role where id = target_id;

  return jsonb_build_object('kind', 'success', 'targetId', target_id, 'role', new_role);
exception
  when lock_not_available or deadlock_detected or serialization_failure or query_canceled then
    return jsonb_build_object('kind', 'temporarily_unavailable', 'correlationId', gen_random_uuid());
end;
$$;

-- Activates or deactivates another user. Same self (R5), protected (R8), unknown-target,
-- and zero-admin (R7) refusals as admin_set_role, serialized on the same advisory lock key.
create function public.admin_set_active(target_id uuid, active boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
set lock_timeout = '5s'
set statement_timeout = '10s'
as $$
declare
  v_target public.profiles%rowtype;
  v_other_active_admins bigint;
  v_resulting_active_admins bigint;
begin
  if public.current_app_role() is distinct from 'admin'::public.app_role then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;

  if target_id is null then
    return jsonb_build_object('kind', 'validation_error', 'field', 'targetId');
  end if;

  -- Refused regardless of the requested value (even a malformed one), before any
  -- lookup or field validation that could disclose anything about the target.
  if target_id = (select auth.uid()) then
    return jsonb_build_object('kind', 'forbidden_self_change');
  end if;

  if active is null then
    return jsonb_build_object('kind', 'validation_error', 'field', 'active');
  end if;

  perform pg_advisory_xact_lock(82010001);

  select * into v_target from public.profiles where id = target_id for update;
  if not found then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;

  if v_target.is_protected then
    return jsonb_build_object('kind', 'forbidden_protected');
  end if;

  select count(*) into v_other_active_admins
  from public.profiles
  where role = 'admin' and is_active and id <> target_id;

  v_resulting_active_admins := v_other_active_admins
    + (case when v_target.role = 'admin' and active then 1 else 0 end);

  if v_resulting_active_admins = 0 then
    return jsonb_build_object('kind', 'forbidden_zero_admins');
  end if;

  update public.profiles set is_active = active where id = target_id;

  return jsonb_build_object('kind', 'success', 'targetId', target_id, 'isActive', active);
exception
  when lock_not_available or deadlock_detected or serialization_failure or query_canceled then
    return jsonb_build_object('kind', 'temporarily_unavailable', 'correlationId', gen_random_uuid());
end;
$$;

revoke all on function public.admin_set_role(uuid, public.app_role) from public, anon, authenticated;
revoke all on function public.admin_set_active(uuid, boolean) from public, anon, authenticated;
grant execute on function public.admin_set_role(uuid, public.app_role) to authenticated;
grant execute on function public.admin_set_active(uuid, boolean) to authenticated;

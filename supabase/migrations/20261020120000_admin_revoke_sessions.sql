-- ADM-01-R10: a password reset also ends the target's existing sessions.
--
-- Resolves ADM-01-R9's open session-revocation question: without this, a session the target
-- already holds could keep working after an admin resets their password. admin_revoke_sessions
-- deletes every row the target has in auth.sessions; auth.refresh_tokens.session_id is
-- "references auth.sessions(id) on delete cascade" (verified locally via `\d auth.refresh_tokens`
-- against this project's local Supabase Postgres image), so every refresh token tied to those
-- sessions is removed in the same statement -- no separate delete is needed. auth.mfa_amr_claims
-- carries the same on-delete-cascade relationship to auth.sessions, so any MFA factor binding for
-- those sessions is cleared too, with no extra statement required.
--
-- Same self (R5)/protected (R8) refusals as admin_set_role/admin_set_active, checked in the same
-- order (admin-only, then self, then unknown/protected target) and before any row is touched.
-- Unlike those two RPCs, this one does not mutate public.profiles and has no zero-admin invariant
-- to protect, so it takes no advisory lock -- there is no concurrent-call race to serialize here.
--
-- security definer here runs as the function owner (postgres on a local/managed Supabase
-- Postgres instance), the same owner as admin_set_role/admin_set_active/current_app_role, which
-- is how those already read/write tables an ordinary authenticated role cannot touch directly;
-- auth.sessions has row-level security enabled with no policies defined for any role, so without
-- running as that privileged owner this delete would silently affect zero rows instead of the
-- target's sessions.
create function public.admin_revoke_sessions(target_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
set lock_timeout = '5s'
set statement_timeout = '10s'
as $$
declare
  v_target public.profiles%rowtype;
  v_deleted bigint;
begin
  if public.current_app_role() is distinct from 'admin'::public.app_role then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;

  if target_id is null then
    return jsonb_build_object('kind', 'validation_error', 'field', 'targetId');
  end if;

  -- Refused regardless of the target's actual state, before any lookup -- same ordering as
  -- admin_set_role/admin_set_active's own self-check (ADM-01-R5).
  if target_id = (select auth.uid()) then
    return jsonb_build_object('kind', 'forbidden_self_change');
  end if;

  select * into v_target from public.profiles where id = target_id;
  if not found then
    return jsonb_build_object('kind', 'forbidden_or_not_found');
  end if;

  if v_target.is_protected then
    return jsonb_build_object('kind', 'forbidden_protected');
  end if;

  delete from auth.sessions where user_id = target_id;
  get diagnostics v_deleted = row_count;

  return jsonb_build_object('kind', 'success', 'targetId', target_id, 'sessionsRevoked', v_deleted);
exception
  when lock_not_available or deadlock_detected or serialization_failure or query_canceled then
    return jsonb_build_object('kind', 'temporarily_unavailable', 'correlationId', gen_random_uuid());
end;
$$;

revoke all on function public.admin_revoke_sessions(uuid) from public, anon, authenticated;
grant execute on function public.admin_revoke_sessions(uuid) to authenticated;

-- ADM-01-R2: list/search accounts for the admin workspace.
--
-- Email lives in auth.users, not public.profiles, so a plain "select * from profiles" cannot
-- satisfy R2's "search by email, full name, or role" on its own. Two options were considered:
--   1. createAdminClient().auth.admin.listUsers() (service-role Auth Admin API) after
--      requireRole("admin"), then join against profiles in the app.
--   2. A security-definer RPC that joins profiles and auth.users server-side.
-- Chosen: (2), a new RPC, for three reasons specific to this codebase. First, listUsers() only
-- supports page/perPage pagination (see @supabase/auth-js GoTrueAdminApi.listUsers) with no
-- email/name/role filter, so "search" would mean pulling every user into the Next.js process and
-- filtering in JS -- fine at this project's size, but it duplicates the is_protected/role/active
-- allowlisting logic that already has to exist for the RPC-only write paths, and it would be the
-- only read in the app that bypasses Postgres entirely for filtering. Second, every other
-- multi-row admin-relevant read in this codebase (list_my_bookings, browse_available_slots) is a
-- security-definer RPC returning exactly the allowlisted jsonb shape the API contract promises, so
-- this keeps ADM-01-R2 consistent with that pattern instead of introducing a second convention.
-- Third, a DB-side RPC can be unit-tested with pgTAP exactly like admin_set_role/admin_set_active,
-- rather than only through a live Auth Admin API integration test.
--
-- security definer here follows the same shape as current_app_role(): it runs as the function
-- owner (which owns public.profiles and, on a local Supabase stack, can read auth.users), so it is
-- not subject to a profiles RLS policy that would otherwise need to also cover auth.users. It returns
-- only the five allowlisted fields the API contract promises (id, email, fullName, role, isActive,
-- isProtected) -- never a password/secret column, and auth.users has none exposed here regardless.
create function public.admin_list_accounts(
  p_query text default null,
  p_role public.app_role default null,
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
    'accounts', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'email', u.email,
            'fullName', p.full_name,
            'role', p.role,
            'isActive', p.is_active,
            'isProtected', p.is_protected
          )
          order by p.created_at, p.id
        )
        from public.profiles p
        join auth.users u on u.id = p.id
        where (p_role is null or p.role = p_role)
          and (p_active is null or p.is_active = p_active)
          and (
            v_query is null
            or u.email ilike '%' || v_query || '%'
            or p.full_name ilike '%' || v_query || '%'
          )
      ),
      '[]'::jsonb
    )
  );
end;
$$;

revoke all on function public.admin_list_accounts(text, public.app_role, boolean)
  from public, anon, authenticated;
grant execute on function public.admin_list_accounts(text, public.app_role, boolean) to authenticated;

-- Students resolve their own session profile directly. Staff discovery belongs to
-- narrow, feature-specific RPC projections rather than broad profiles table reads.
drop policy if exists "profiles: active users read staff" on public.profiles;

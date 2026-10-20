-- SH-06-R7: app-level rate limit on wrong current-password verification attempts for the
-- self-service "change my own password" flow (SH-06). Supabase Auth's own sign-in rate limit
-- is per IP, and every verification attempt in this flow comes from the server's own IP, so it
-- does not protect an individual account from repeated guesses; this table backs the app's own
-- per-account limit instead.
--
-- Shape and access mirror public.ai_usage exactly: RLS enabled, no policies, every privilege
-- revoked from anon/authenticated. Only the server writes/reads it, with createAdminClient()
-- (the secret key, bypassing RLS) after requireUser() -- never a client-supplied user id.
create table public.password_change_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index password_change_attempts_user_recent_idx
  on public.password_change_attempts (user_id, created_at);

alter table public.password_change_attempts enable row level security;

-- No policies: only the server's secret-key client may read or write this table.
revoke all on public.password_change_attempts from public, anon, authenticated;

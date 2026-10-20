-- STU-05: minimal server-only AI attempt accounting. Prompt and response bodies are never stored.
alter table public.ai_usage
  add column state text not null default 'succeeded'
    check (state in ('pending', 'succeeded', 'failed', 'expired', 'indeterminate')),
  add column admission_day date,
  add column resolved_at timestamptz;

update public.ai_usage
set admission_day = (created_at at time zone 'Asia/Singapore')::date
where admission_day is null;

alter table public.ai_usage alter column admission_day set not null;

create index ai_usage_admission_day_idx on public.ai_usage (admission_day, state, created_at desc);
create index ai_usage_user_admission_day_idx
  on public.ai_usage (user_id, admission_day, state, created_at desc);
create unique index ai_usage_one_pending_student_improvement_idx
  on public.ai_usage (user_id)
  where state = 'pending' and feature = 'student.improve-request';

-- This function is intentionally service-role-only. The Server Action checks the active Student role
-- before it invokes this trusted accounting boundary.
create function public.claim_ai_attempt(p_user_id uuid, p_feature text) returns jsonb
language plpgsql security definer set search_path = ''
set lock_timeout = '5s' set statement_timeout = '10s' as $$
declare
  v_now timestamptz := clock_timestamp();
  v_day date := (v_now at time zone 'Asia/Singapore')::date;
  v_user_minute integer;
  v_global_minute integer;
  v_user_day integer;
  v_global_day integer;
  v_pending_since timestamptz;
  v_attempt_id bigint;
begin
  if p_user_id is null or p_feature <> 'student.improve-request' then
    return jsonb_build_object('kind', 'unavailable');
  end if;

  -- Serializes global capacity decisions and reconciles attempts whose caller disappeared.
  perform pg_advisory_xact_lock(hashtext('public.ai_usage.student-improve-request'));
  update public.ai_usage
  set state = 'expired', resolved_at = v_now
  where state in ('pending', 'indeterminate')
    and created_at < v_now - interval '2 minutes';

  select min(created_at) into v_pending_since
  from public.ai_usage
  where user_id = p_user_id and feature = p_feature and state in ('pending', 'indeterminate');
  if v_pending_since is not null then
    return jsonb_build_object('kind', 'in_flight');
  end if;

  select count(*) into v_user_minute from public.ai_usage
  where user_id = p_user_id and created_at >= v_now - interval '60 seconds'
    and state in ('pending', 'succeeded');
  select count(*) into v_global_minute from public.ai_usage
  where created_at >= v_now - interval '60 seconds' and state in ('pending', 'succeeded');
  select count(*) into v_user_day from public.ai_usage
  where user_id = p_user_id and admission_day = v_day and state in ('pending', 'succeeded');
  select count(*) into v_global_day from public.ai_usage
  where admission_day = v_day and state in ('pending', 'succeeded');

  if v_user_minute >= 3 or v_global_minute >= 10 then
    return jsonb_build_object('kind', 'quota_exceeded', 'retryAfterSeconds', 60);
  end if;
  if v_user_day >= 10 or v_global_day >= 500 then
    return jsonb_build_object('kind', 'quota_exceeded', 'retryAfterSeconds', 60);
  end if;

  insert into public.ai_usage (user_id, feature, state, admission_day)
  values (p_user_id, p_feature, 'pending', v_day)
  returning id into v_attempt_id;
  return jsonb_build_object('kind', 'admitted', 'attemptId', v_attempt_id);
exception when unique_violation then
  return jsonb_build_object('kind', 'in_flight');
when lock_not_available or deadlock_detected or serialization_failure or query_canceled then
  return jsonb_build_object('kind', 'unavailable');
end;
$$;

create function public.resolve_ai_attempt(p_attempt_id bigint, p_outcome text) returns boolean
language plpgsql security definer set search_path = ''
set lock_timeout = '5s' set statement_timeout = '10s' as $$
begin
  if p_attempt_id is null or p_outcome not in ('succeeded', 'failed', 'indeterminate') then
    return false;
  end if;
  update public.ai_usage
  set state = p_outcome, resolved_at = clock_timestamp()
  where id = p_attempt_id and state = 'pending';
  return found;
exception when lock_not_available or deadlock_detected or serialization_failure or query_canceled then
  return false;
end;
$$;

-- Hosting must invoke this server-only function on a reliable schedule. Calling it opportunistically
-- does not satisfy STU-05's no-later-than-30-day deletion guarantee by itself.
create function public.purge_expired_ai_attempts() returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_deleted bigint;
begin
  delete from public.ai_usage where created_at < clock_timestamp() - interval '30 days';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.claim_ai_attempt(uuid, text) from public, anon, authenticated;
revoke all on function public.resolve_ai_attempt(bigint, text) from public, anon, authenticated;
revoke all on function public.purge_expired_ai_attempts() from public, anon, authenticated;
grant execute on function public.claim_ai_attempt(uuid, text) to service_role;
grant execute on function public.resolve_ai_attempt(bigint, text) to service_role;
grant execute on function public.purge_expired_ai_attempts() to service_role;

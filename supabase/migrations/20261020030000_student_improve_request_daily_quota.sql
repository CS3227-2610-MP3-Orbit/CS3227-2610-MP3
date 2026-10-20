-- STU-05: replace minute/per-Student quotas with a 100-successful-response shared SGT daily capacity.
create or replace function public.claim_ai_attempt(p_user_id uuid, p_feature text) returns jsonb
language plpgsql security definer set search_path = ''
set lock_timeout = '5s' set statement_timeout = '10s' as $$
declare
  v_now timestamptz := clock_timestamp();
  v_day date := (v_now at time zone 'Asia/Singapore')::date;
  v_global_day integer;
  v_pending_since timestamptz;
  v_attempt_id bigint;
begin
  if p_user_id is null or p_feature <> 'student.improve-request' then
    return jsonb_build_object('kind', 'unavailable');
  end if;

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

  -- Pending reservations prevent concurrent admissions exceeding the successful-response budget.
  select count(*) into v_global_day from public.ai_usage
  where admission_day = v_day and state in ('pending', 'succeeded');
  if v_global_day >= 100 then
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

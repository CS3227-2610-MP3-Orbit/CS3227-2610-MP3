begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

-- This fixture is intended for a disposable migrated database. Every change rolls back.
delete from public.ai_usage;

select has_function(
  'public',
  'claim_ai_attempt',
  array['uuid', 'text'],
  '[STU-05-AC7] [STU-05-AC10] atomic AI-attempt claim RPC exists'
);
select has_function(
  'public',
  'resolve_ai_attempt',
  array['bigint', 'text'],
  '[STU-05-AC11] [STU-05-AC14] atomic AI-attempt resolution RPC exists'
);

select set_config(
  'stu05.student',
  '11000000-0000-4000-8000-000000000001',
  true
);

-- Failed attempts release daily capacity; there is no minute or per-Student daily quota.
select set_config(
  'stu05.attempt_1',
  public.claim_ai_attempt(current_setting('stu05.student')::uuid, 'student.improve-request')->>'attemptId',
  true
);
select is(
  public.resolve_ai_attempt(current_setting('stu05.attempt_1')::bigint, 'failed'),
  true,
  '[STU-05-AC7] failed first admitted attempt is resolved'
);
select set_config(
  'stu05.attempt_2',
  public.claim_ai_attempt(current_setting('stu05.student')::uuid, 'student.improve-request')->>'attemptId',
  true
);
select is(
  public.resolve_ai_attempt(current_setting('stu05.attempt_2')::bigint, 'failed'),
  true,
  '[STU-05-AC7] failed second admitted attempt is resolved'
);
select set_config(
  'stu05.attempt_3',
  public.claim_ai_attempt(current_setting('stu05.student')::uuid, 'student.improve-request')->>'attemptId',
  true
);
select is(
  public.resolve_ai_attempt(current_setting('stu05.attempt_3')::bigint, 'failed'),
  true,
  '[STU-05-AC7] failed third admitted attempt is resolved'
);
select is(
  public.claim_ai_attempt(current_setting('stu05.student')::uuid, 'student.improve-request')->>'kind',
  'admitted',
  '[STU-05-AC7] fourth Student admission remains allowed without a minute quota'
);

delete from public.ai_usage;
select set_config(
  'stu05.pending',
  public.claim_ai_attempt(current_setting('stu05.student')::uuid, 'student.improve-request')->>'attemptId',
  true
);
select is(
  public.claim_ai_attempt(current_setting('stu05.student')::uuid, 'student.improve-request')->>'kind',
  'in_flight',
  '[STU-05-AC11] a second overlapping Student attempt is refused'
);
select is(
  (select count(*)::integer from public.ai_usage where state = 'pending'),
  1,
  '[STU-05-AC11] only one pending attempt is recorded'
);

delete from public.ai_usage;
insert into public.ai_usage (user_id, feature, state, admission_day)
select
  '10000000-0000-4000-8000-000000000001'::uuid,
  'student.improve-request',
  'succeeded',
  (clock_timestamp() at time zone 'Asia/Singapore')::date
from generate_series(1, 99);
select set_config(
  'stu05.global_hundredth',
  public.claim_ai_attempt(current_setting('stu05.student')::uuid, 'student.improve-request')->>'attemptId',
  true
);
select is(
  public.resolve_ai_attempt(current_setting('stu05.global_hundredth')::bigint, 'succeeded'),
  true,
  '[STU-05-AC9] 100th app-wide admission is allowed and can resolve as successful'
);
select is(
  (select admission_day from public.ai_usage where id = current_setting('stu05.global_hundredth')::bigint),
  (clock_timestamp() at time zone 'Asia/Singapore')::date,
  '[STU-05-AC8] admitted capacity uses the trusted Singapore calendar day'
);
select is(
  public.claim_ai_attempt(current_setting('stu05.student')::uuid, 'student.improve-request')->>'kind',
  'quota_exceeded',
  '[STU-05-AC9] 101st app-wide admission is refused'
);

reset role;
set local role authenticated;
select throws_ok(
  $$select public.claim_ai_attempt('11000000-0000-4000-8000-000000000001', 'student.improve-request')$$,
  '42501',
  null,
  '[STU-05-AC2] authenticated browser role cannot call server-only accounting RPC'
);

select * from finish();
rollback;

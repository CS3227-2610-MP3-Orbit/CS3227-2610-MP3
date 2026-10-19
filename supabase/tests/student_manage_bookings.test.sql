begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

-- STU-04 acceptance contract. The names below are intentionally explicit so the
-- implementation must provide narrow RPCs rather than direct table access. This
-- pre-code test is expected to be red until the STU-04 migration exists.
select has_function('public', 'list_my_bookings', array[]::text[],
  '[STU-04-AC1] [STU-04-AC2] [STU-04-AC3] owned non-paginated list RPC exists');
select has_function('public', 'get_my_booking', array['uuid'],
  '[STU-04-AC1] [STU-04-AC2] [STU-04-AC9] non-enumerating owned detail RPC exists');
select has_function('public', 'update_my_booking', array['uuid', 'text', 'text', 'text', 'uuid'],
  '[STU-04-AC4] [STU-04-AC5] [STU-04-AC10] [STU-04-AC12] versioned idempotent edit RPC exists');
select has_function('public', 'cancel_my_booking', array['uuid', 'text', 'uuid'],
  '[STU-04-AC6] [STU-04-AC7] [STU-04-AC8] [STU-04-AC10] versioned idempotent cancellation RPC exists');

-- Existing protections must remain true before new RPCs are introduced.
set local role authenticated;
set local request.jwt.claim.sub = '74000000-0000-4000-8000-000000000001';
select throws_ok('select * from public.bookings', '42501', null,
  '[STU-04-AC9] direct booking reads remain denied to Students');
select throws_ok($$update public.bookings set status='cancelled'$$, '42501', null,
  '[STU-04-AC6] [STU-04-AC7] direct cancellation remains denied');
select throws_ok($$update public.bookings set topic='forged'$$, '42501', null,
  '[STU-04-AC4] direct content edits remain denied');

-- AC11 is an end-to-end/manual accessibility concern. It is covered by the
-- browser test, not a database assertion.
select pass('[STU-04-AC11] browser accessibility coverage is defined in tests/e2e/student-manage-bookings.spec.ts');
select * from finish();
rollback;

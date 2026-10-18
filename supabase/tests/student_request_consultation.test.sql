begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

-- All fictional fixtures and writes roll back, even when run on the disposable DB.
insert into auth.users(id) values
('72000000-0000-4000-8000-000000000001'),
('72000000-0000-4000-8000-000000000002'),
('72000000-0000-4000-8000-000000000003');
update public.profiles set role='lecturer' where id='72000000-0000-4000-8000-000000000003';
insert into public.courses(id,code,name) values ('72000000-0000-4000-8000-000000000004','V-STU02','Verification');
insert into public.course_lecturers(course_id,lecturer_id) values
('72000000-0000-4000-8000-000000000004','72000000-0000-4000-8000-000000000003');
insert into public.consultation_slots(id,course_id,lecturer_id,starts_at,ends_at) values
('72000000-0000-4000-8000-000000000005','72000000-0000-4000-8000-000000000004','72000000-0000-4000-8000-000000000003','2099-02-01 01:00Z','2099-02-01 02:00Z');
set local role authenticated;
set local request.jwt.claim.sub='72000000-0000-4000-8000-000000000001';
select is(public.current_app_role()::text,'student','fixture active Student identity validated');
select is(auth.uid()::text,'72000000-0000-4000-8000-000000000001','fixture JWT identity validated');
select is(public.get_request_slot('72000000-0000-4000-8000-000000000005')->>'kind','success','[STU-02-AC1] eligible direct lookup works');
select set_config('stu02.version',public.get_request_slot('72000000-0000-4000-8000-000000000005')->'slot'->>'slotVersion',true);
select is(public.get_request_slot('72000000-0000-4000-8000-000000000099')->>'kind','forbidden_or_not_found','[STU-02-AC19] missing lookup is non-enumerating');
select is(public.request_consultation('72000000-0000-4000-8000-000000000005',current_setting('stu02.version'),' ', 'Question','72000000-0000-4000-8000-000000000006')->>'kind','validation_error','[STU-02-AC4] RPC rejects whitespace topic');
select is(public.request_consultation('72000000-0000-4000-8000-000000000005',current_setting('stu02.version'),U&'\FEFF\00A0', 'Question','72000000-0000-4000-8000-000000000006')->>'kind','validation_error','[STU-02-AC4] RPC matches ECMAScript BOM/NBSP trimming');
select is(public.request_consultation('72000000-0000-4000-8000-000000000005',current_setting('stu02.version'),'Topic', '', '72000000-0000-4000-8000-000000000006')->>'kind','validation_error','[STU-02-AC4] RPC rejects empty questions');
select is(public.request_consultation('72000000-0000-4000-8000-000000000005',current_setting('stu02.version'),null, 'Question','72000000-0000-4000-8000-000000000006')->>'kind','validation_error','[STU-02-AC4] RPC rejects missing topic');
select throws_ok($$select public.request_consultation('72000000-0000-4000-8000-000000000005',current_setting('stu02.version'),chr(0),'Question','72000000-0000-4000-8000-000000000006')$$,'54000',null,'[STU-02-AC4] PostgreSQL rejects NUL before text RPC invocation');
select throws_ok($$select public.request_consultation('72000000-0000-4000-8000-000000000005',current_setting('stu02.version'),convert_from(decode('eda080','hex'),'UTF8'),'Question','72000000-0000-4000-8000-000000000006')$$,'22021',null,'[STU-02-AC4] PostgreSQL rejects invalid UTF8 surrogate bytes');
select is(public.request_consultation('72000000-0000-4000-8000-000000000005',current_setting('stu02.version'),repeat('😀',201), 'Question','72000000-0000-4000-8000-000000000006')->>'kind','validation_error','[STU-02-AC4] RPC rejects 201 code points');
select is(public.request_consultation('72000000-0000-4000-8000-000000000005',current_setting('stu02.version'),'Topic', repeat('😀',2001),'72000000-0000-4000-8000-000000000006')->>'kind','validation_error','[STU-02-AC4] RPC rejects 2001 question code points');
select is(public.request_consultation('72000000-0000-4000-8000-000000000005',current_setting('stu02.version'),repeat('😀',200), repeat('😀',2000),'72000000-0000-4000-8000-000000000006')->>'kind','success','[STU-02-AC2] [STU-02-AC4] maximum Unicode lengths create pending');
select is(public.recover_consultation('72000000-0000-4000-8000-000000000006')->'receipt'->>'status','pending','[STU-02-AC2] owned receipt confirms pending');
select throws_ok('select * from public.bookings','42501',null,'[STU-02-AC9] direct booking reads remain denied');
select throws_ok($$insert into public.bookings(slot_id,student_id,topic,questions) values ('72000000-0000-4000-8000-000000000005','72000000-0000-4000-8000-000000000002','forged','forged')$$,'42501',null,'[STU-02-AC9] direct forged-owner writes denied');
set local request.jwt.claim.sub='72000000-0000-4000-8000-000000000002';
select is(public.recover_consultation('72000000-0000-4000-8000-000000000006')->>'kind','forbidden_or_not_found','[STU-02-AC9] another Student cannot recover the key');
set local request.jwt.claim.sub='72000000-0000-4000-8000-000000000003';
select is(public.get_request_slot('72000000-0000-4000-8000-000000000005')->>'kind','forbidden_or_not_found','[STU-02-AC8] Lecturer denied lookup');
reset role;
select is((select count(*)::int from public.bookings where slot_id='72000000-0000-4000-8000-000000000005'),1,'[STU-02-AC2] exactly one booking created');
update public.profiles set is_active=false where id='72000000-0000-4000-8000-000000000001';
set local role authenticated;
set local request.jwt.claim.sub='72000000-0000-4000-8000-000000000001';
select is(public.recover_consultation('72000000-0000-4000-8000-000000000006')->>'kind','forbidden_or_not_found','[STU-02-AC8] deactivation blocks existing receipt');
select * from finish();
rollback;

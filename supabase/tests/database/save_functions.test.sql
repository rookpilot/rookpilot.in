-- Proves the all-or-nothing save functions. Run with: npm run db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'owner@test.dev'),
  ('aaaaaaaa-0000-0000-0000-00000000000b', 'stranger@test.dev');

create function pg_temp.act_as(person uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', person, 'role', 'authenticated')::text, true);
$$;

select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');

-- Onboarding
select lives_ok($$
  select public.create_building(
    '{"id": "b1000000-0000-0000-0000-000000000001", "name": "Test house", "type": "house", "city": "Portland"}',
    '[{"id": "51000000-0000-0000-0000-000000000001", "building_id": "b1000000-0000-0000-0000-000000000001", "name": "Kitchen", "kind": "kitchen", "sort_order": 0}]',
    '[{"id": "11000000-0000-0000-0000-000000000001", "building_id": "b1000000-0000-0000-0000-000000000001", "space_id": "51000000-0000-0000-0000-000000000001", "name": "Fridge filter", "brand": "", "model": "", "notes": ""}]',
    '[{"id": "5c100000-0000-0000-0000-000000000001", "building_id": "b1000000-0000-0000-0000-000000000001", "item_id": "11000000-0000-0000-0000-000000000001", "title": "Replace", "repeat": {"kind": "interval", "count": 6, "unit": "month"}, "next_due_on": "2026-12-01", "active": true}]'
  )
$$, 'Onboarding saves a building with its rooms, items, and timers');
select is((select count(*)::int from public.schedules where building_id = 'b1000000-0000-0000-0000-000000000001'), 1, 'The timer was saved');
select is((select role::text from public.building_members where building_id = 'b1000000-0000-0000-0000-000000000001'), 'owner',
  'Onboarding makes you the owner');

select throws_ok($$
  select public.create_building(
    '{"id": "b1000000-0000-0000-0000-000000000002", "name": "Half house", "type": "house"}',
    '[{"id": "51000000-0000-0000-0000-000000000002", "building_id": "b1000000-0000-0000-0000-000000000002", "name": "", "kind": "kitchen", "sort_order": 0}]',
    '[]', '[]'
  )
$$, '23514', null, 'A bad room fails the whole save');
select is_empty($$ select id from public.buildings where id = 'b1000000-0000-0000-0000-000000000002' $$,
  'and leaves no half-saved building behind');

-- Mark done
insert into public.contacts (id, name) values ('c1000000-0000-0000-0000-000000000001', 'Pat');
select lives_ok($$
  select public.complete_schedules('[{
    "log": {"id": "1e100000-0000-0000-0000-000000000001", "building_id": "b1000000-0000-0000-0000-000000000001",
            "item_id": "11000000-0000-0000-0000-000000000001", "schedule_id": "5c100000-0000-0000-0000-000000000001",
            "title": "Replace", "done_on": "2026-11-05", "note": "", "cost": 42.5},
    "contact_ids": ["c1000000-0000-0000-0000-000000000001"],
    "last_done_on": "2026-11-05", "next_due_on": "2027-05-05"
  }]')
$$, 'Mark done saves');
select is((select next_due_on from public.schedules where id = '5c100000-0000-0000-0000-000000000001'), '2027-05-05'::date,
  'Mark done moves the timer forward');
select is((select count(*)::int from public.log_entry_contacts where log_entry_id = '1e100000-0000-0000-0000-000000000001'), 1,
  'Mark done saves who helped');

-- Projects and repairs
select lives_ok($$
  select public.save_work(
    '{"id": "a1000000-0000-0000-0000-000000000001", "building_id": "b1000000-0000-0000-0000-000000000001", "kind": "repair",
      "title": "Leak", "status": "open", "performed_by": "hired", "notes": ""}',
    array['c1000000-0000-0000-0000-000000000001']::uuid[]
  )
$$, 'Saving a repair with a helper works');
select lives_ok($$
  select public.save_work(
    '{"id": "a1000000-0000-0000-0000-000000000001", "building_id": "b1000000-0000-0000-0000-000000000001", "kind": "repair",
      "title": "Leak under sink", "status": "fixed", "performed_by": "hired", "notes": ""}',
    array[]::uuid[]
  )
$$, 'Saving it again updates it');
select results_eq($$ select title || ' / ' || status from public.work where id = 'a1000000-0000-0000-0000-000000000001' $$,
  array['Leak under sink / fixed'], 'The edit replaced the old values');
select is_empty($$ select contact_id from public.work_contacts where work_id = 'a1000000-0000-0000-0000-000000000001' $$,
  'and removed the helper tag');

select * from finish();
rollback;

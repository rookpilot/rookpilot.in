-- Proves the "who sees what" rules. Run with: npm run db:test
-- Everything happens inside one transaction and is rolled back at the end.
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

-- Three people: Alex owns a house, Sam gets added to it, Kim is a stranger.
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'alex@test.dev', '{"full_name": "Alex"}'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'sam@test.dev', '{"full_name": "Sam"}'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'kim@test.dev', '{"full_name": "Kim"}');

-- Acts as one person for the statements that follow.
create function pg_temp.act_as(person uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', person, 'role', 'authenticated')::text, true);
$$;

select is((select full_name from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'Alex',
  'Signing up creates a profile with your name');

-- Alex creates a house and gets back the new row.
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000001');
select lives_ok($$
  insert into public.buildings (id, name, type) values ('bbbbbbbb-0000-0000-0000-000000000001', 'Alex house', 'house') returning id
$$, 'Anyone signed in can create a building');
select is((select role::text from public.building_members where building_id = 'bbbbbbbb-0000-0000-0000-000000000001'
  and user_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'owner', 'The creator becomes its owner');
select lives_ok($$
  insert into public.spaces (id, building_id, name, kind) values ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'Kitchen', 'kitchen');
  insert into public.work (id, building_id, kind, title, status) values ('dddddddd-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'repair', 'Leak', 'open');
  insert into public.contacts (id, name) values ('eeeeeeee-0000-0000-0000-000000000001', 'Pat the plumber'), ('eeeeeeee-0000-0000-0000-000000000002', 'Lee the roofer');
$$, 'The owner can add rooms, repairs, and contacts');
select is((select owner_id from public.contacts where id = 'eeeeeeee-0000-0000-0000-000000000001'),
  'aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'A new contact belongs to whoever added it');
select throws_ok($$
  insert into public.work (building_id, kind, title, status) values ('bbbbbbbb-0000-0000-0000-000000000001', 'repair', 'Bad status', 'idea')
$$, '23514', null, 'A repair cannot use a project status');

-- Sam isn't a member yet: sees nothing and can't add anything.
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000002');
select is_empty($$ select id from public.buildings $$, 'A stranger sees no buildings');
select is_empty($$ select id from public.spaces $$, 'A stranger sees no rooms');
select throws_ok($$
  insert into public.spaces (building_id, name) values ('bbbbbbbb-0000-0000-0000-000000000001', 'Sneaky room')
$$, '42501', null, 'A stranger cannot add rooms');
select throws_ok($$
  insert into public.building_members (building_id, user_id) values ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002')
$$, '42501', null, 'A stranger cannot add themselves to a building');

-- Alex adds Sam and tags Pat on the repair.
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000001');
insert into public.building_members (building_id, user_id) values ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002');
insert into public.work_contacts (work_id, contact_id) values ('dddddddd-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000001');

-- Now Sam sees the house and the tagged contact, but not Alex's other contacts.
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000002');
select results_eq($$ select name from public.buildings $$, array['Alex house'], 'A member sees the shared building');
select results_eq($$ select name from public.spaces $$, array['Kitchen'], 'A member sees its rooms');
select results_eq($$ select name from public.contacts $$, array['Pat the plumber'],
  'A member sees contacts tagged in the building, not the owner''s whole list');
select results_eq($$ select full_name from public.profiles order by full_name $$, array['Alex', 'Sam'],
  'Members see each other''s names');
select lives_ok($$
  update public.work set status = 'in_progress' where id = 'dddddddd-0000-0000-0000-000000000001'
$$, 'A member can edit the building''s repairs');
select is_empty($$
  delete from public.buildings where id = 'bbbbbbbb-0000-0000-0000-000000000001' returning id
$$, 'A member cannot delete the building');
select is_empty($$
  update public.contacts set name = 'Renamed' where id = 'eeeeeeee-0000-0000-0000-000000000001' returning id
$$, 'A member cannot edit someone else''s contact');

-- Kim is still a stranger to all of it.
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000003');
select is_empty($$ select id from public.contacts $$, 'A stranger sees none of the tagged contacts');
select is_empty($$ select id from public.profiles where id <> 'aaaaaaaa-0000-0000-0000-000000000003' $$,
  'A stranger sees no one else''s profile');

-- Logged-out visitors can't read the tables at all.
reset role;
set local role anon;
select throws_ok($$ select id from public.buildings $$, '42501', null, 'Logged-out visitors cannot read buildings');

select * from finish();
rollback;

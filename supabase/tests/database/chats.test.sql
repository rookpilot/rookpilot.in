-- Proves saved chats are private. Run with: npm run db:test
-- Everything happens inside one transaction and is rolled back at the end.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

-- Alex owns a house and adds Sam. Kim is a stranger.
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000021', 'alex@test.dev', '{"full_name": "Alex"}'),
  ('aaaaaaaa-0000-0000-0000-000000000022', 'sam@test.dev', '{"full_name": "Sam"}'),
  ('aaaaaaaa-0000-0000-0000-000000000023', 'kim@test.dev', '{"full_name": "Kim"}');

create function pg_temp.act_as(person uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', person, 'role', 'authenticated')::text, true);
$$;

select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000021');
insert into public.buildings (id, name, type) values ('bbbbbbbb-0000-0000-0000-000000000021', 'Alex house', 'house');
insert into public.building_members (building_id, user_id) values ('bbbbbbbb-0000-0000-0000-000000000021', 'aaaaaaaa-0000-0000-0000-000000000022');

select lives_ok($$
  insert into public.chats (id, building_id, title) values ('cccccccc-0000-0000-0000-000000000021', 'bbbbbbbb-0000-0000-0000-000000000021', 'Add a fire pit')
$$, 'A member can start a chat');
select is((select user_id from public.chats where id = 'cccccccc-0000-0000-0000-000000000021'),
  'aaaaaaaa-0000-0000-0000-000000000021'::uuid, 'A new chat belongs to whoever started it');
select lives_ok($$
  update public.chats set title = 'Fire pit plans', updated_at = now() where id = 'cccccccc-0000-0000-0000-000000000021'
$$, 'People can rename their own chat');
select throws_ok($$
  update public.chats set building_id = 'bbbbbbbb-0000-0000-0000-000000000021' where id = 'cccccccc-0000-0000-0000-000000000021'
$$, '42501', null, 'A chat cannot move to another building');

-- Sam shares the house but can't see or touch Alex's chat.
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000022');
select is_empty($$ select id from public.chats $$, 'Someone in the same building cannot see your chats');
select is_empty($$
  update public.chats set title = 'Hacked' where id = 'cccccccc-0000-0000-0000-000000000021' returning id
$$, 'Someone else cannot rename your chat');
select is_empty($$
  delete from public.chats where id = 'cccccccc-0000-0000-0000-000000000021' returning id
$$, 'Someone else cannot delete your chat');
select throws_ok($$
  insert into public.chats (user_id, building_id, title) values ('aaaaaaaa-0000-0000-0000-000000000021', 'bbbbbbbb-0000-0000-0000-000000000021', 'Pretend')
$$, '42501', null, 'You cannot start a chat as someone else');

-- Kim can't start a chat in a building they don't belong to.
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000023');
select throws_ok($$
  insert into public.chats (building_id, title) values ('bbbbbbbb-0000-0000-0000-000000000021', 'Sneaky')
$$, '42501', null, 'A stranger cannot start a chat in your building');
select throws_ok($$ select count(*) from agent.checkpoints $$, '42501', null,
  'Signed-in people cannot read the saved memory');

-- Deleting a chat deletes its memory too.
reset role;
insert into agent.checkpoints (thread_id, checkpoint_id, checkpoint) values
  ('aaaaaaaa-0000-0000-0000-000000000021:cccccccc-0000-0000-0000-000000000021', '1', '{}'),
  ('someone-else:other-chat', '1', '{}');
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000021');
delete from public.chats where id = 'cccccccc-0000-0000-0000-000000000021';
reset role;
select is((select count(*)::int from agent.checkpoints where thread_id like 'aaaaaaaa-0000-0000-0000-000000000021:%'), 0,
  'Deleting a chat deletes its memory');
select is((select count(*)::int from agent.checkpoints where thread_id = 'someone-else:other-chat'), 1,
  'Other chats keep their memory');

select * from finish();
rollback;

-- Proves the chat settings on profiles. Run with: npm run db:test
-- Everything happens inside one transaction and is rolled back at the end.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000011', 'alex@test.dev', '{"full_name": "Alex"}'),
  ('aaaaaaaa-0000-0000-0000-000000000012', 'sam@test.dev', '{"full_name": "Sam"}');

create function pg_temp.act_as(person uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', person, 'role', 'authenticated')::text, true);
$$;

select is((select confirm_mode from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000011'), 'sometimes',
  'Everyone starts on sometimes');

select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000011');
select lives_ok($$
  update public.profiles set confirm_mode = 'always' where id = 'aaaaaaaa-0000-0000-0000-000000000011'
$$, 'People can change their own level');
select throws_ok($$
  update public.profiles set confirm_mode = 'loud' where id = 'aaaaaaaa-0000-0000-0000-000000000011'
$$, '23514', null, 'Only rarely, sometimes, or always are allowed');
select is_empty($$
  update public.profiles set confirm_mode = 'rarely' where id = 'aaaaaaaa-0000-0000-0000-000000000012' returning id
$$, 'Nobody can change someone else''s level');

select * from finish();
rollback;

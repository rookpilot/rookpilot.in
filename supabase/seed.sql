-- Local sample data, loaded by `npx supabase db reset`. Never runs on the hosted project.
--
-- Two test logins, both with the password "password123":
--   test@rookpilot.dev     owns Elm Street house
--   partner@rookpilot.dev  shares Elm Street house, and owns Mom's house

-- Accounts
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated',
   'test@rookpilot.dev', extensions.crypt('password123', extensions.gen_salt('bf')), now(),
   '{"provider": "email", "providers": ["email"]}', '{"full_name": "Test Owner"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated',
   'partner@rookpilot.dev', extensions.crypt('password123', extensions.gen_salt('bf')), now(),
   '{"provider": "email", "providers": ["email"]}', '{"full_name": "Test Partner"}', now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text, 'email',
       jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), now(), now(), now()
from auth.users
where id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

-- Buildings. Creating one makes created_by its owner.
insert into public.buildings (id, name, type, address_line1, city, region, postal_code, country, beds, baths, year_built, sqft, created_by)
values
  ('b0000000-0000-0000-0000-000000000001', 'Elm Street house', 'house', '1428 Elm Street', 'Portland', 'OR', '97214', 'US',
   3, 2, 1994, 1850, '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-000000000002', 'Mom''s house', 'house', '22 Birch Lane', 'Salem', 'OR', '97301', 'US',
   2, 1, 1978, 1200, '22222222-2222-2222-2222-222222222222');

insert into public.building_members (building_id, user_id, role)
values ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'member');

-- Rooms
insert into public.spaces (id, building_id, name, kind, sort_order)
values
  ('50000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Whole house', 'whole_building', 0),
  ('50000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Kitchen', 'kitchen', 1),
  ('50000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Hallway', 'hallway', 2),
  ('50000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Garage', 'garage', 3),
  ('50000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'Whole house', 'whole_building', 0),
  ('50000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000002', 'Kitchen', 'kitchen', 1);

-- Items
insert into public.items (id, building_id, space_id, name, template_key, installed_on)
values
  ('10000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'Air filter', 'air_filter', null),
  ('10000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 'Fridge water filter', 'fridge_filter', null),
  ('10000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003', 'Smoke alarm', 'smoke_alarm', '2022-03-01'),
  ('10000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', 'Garage door', 'garage_door', null),
  ('10000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000005', 'Furnace', 'furnace', null),
  ('10000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000006', 'Dishwasher filter', 'dishwasher_filter', null);

-- Timers, dated around today so some are overdue, some due soon, some later.
insert into public.schedules (id, building_id, item_id, title, repeat, last_done_on, next_due_on)
values
  ('5c000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'Replace', '{"kind": "interval", "count": 3, "unit": "month"}', current_date - 30, current_date + 60),
  ('5c000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002',
   'Replace', '{"kind": "interval", "count": 6, "unit": "month"}', current_date - 190, current_date - 7),
  ('5c000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003',
   'Test', '{"kind": "interval", "count": 1, "unit": "month"}', current_date - 27, current_date + 3),
  ('5c000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003',
   'Replace battery', '{"kind": "interval", "count": 1, "unit": "year"}', current_date - 300, current_date + 65),
  ('5c000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004',
   'Lubricate', '{"kind": "interval", "count": 1, "unit": "year"}', current_date - 370, current_date - 5),
  ('5c000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005',
   'Service', '{"kind": "seasonal", "seasons": ["fall"]}', current_date - 360, current_date + 10),
  ('5c000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006',
   'Clean', '{"kind": "interval", "count": 1, "unit": "month"}', current_date - 40, current_date - 10);

-- Contacts belong to the person who added them.
insert into public.contacts (id, owner_id, name, company, trade, phone, email, instagram, why_we_like_them)
values
  ('c0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Dana Ruiz', 'Ruiz Door Co.', 'Garage doors',
   '(503) 555-0142', 'dana@ruizdoors.example', 'ruizdoors', 'Shows up on time and explains the problem before quoting.'),
  ('c0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Priya Anand', '', 'Plumber',
   '(503) 555-0187', '', '', 'Fixed the hall sink leak the same day.'),
  ('c0000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Marco Lee', '', 'Handyman, friend',
   '', '', 'marcobuilds', 'Lends tools and knows a bit of everything.');

-- Projects and repairs
insert into public.work (id, building_id, kind, title, status, space_id, item_id, performed_by, cost, budget, started_on, planned_on, finished_on, notes)
values
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'repair', 'Grinding garage door', 'in_progress',
   '50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'hired', 240, null,
   current_date - 7, current_date + 4, null, 'Loud grinding when opening. Left roller looks worn.'),
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'project', 'Repaint the kitchen', 'idea',
   '50000000-0000-0000-0000-000000000002', null, 'diy', null, 600, null, null, null, '');

insert into public.work_contacts (work_id, contact_id)
values ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001');

-- History
insert into public.log_entries (id, building_id, item_id, schedule_id, title, done_on, note, cost)
values
  ('1e000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   '5c000000-0000-0000-0000-000000000001', 'Replace', current_date - 30, 'MERV 11, 16x25x1.', 18),
  ('1e000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005',
   '5c000000-0000-0000-0000-000000000006', 'Service', current_date - 360, '', 129);

insert into public.log_entry_contacts (log_entry_id, contact_id)
values ('1e000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003');

-- Rooms and areas. Called "spaces" so the name also fits a lobby, a yard, or the whole building.
create type public.room_kind as enum (
  'whole_building', 'bedroom', 'bathroom', 'kitchen', 'living', 'hallway', 'laundry', 'garage', 'garden', 'other'
);

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  kind public.room_kind not null default 'other',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  -- Lets items point at (space, building) so an item's room is always in the same building.
  unique (id, building_id)
);

create index spaces_building_id_idx on public.spaces (building_id);

alter table public.spaces enable row level security;
revoke all on table public.spaces from anon, authenticated;
grant select, insert, update, delete on table public.spaces to authenticated;

create policy "Members manage their buildings' spaces"
  on public.spaces for all to authenticated
  using (private.is_building_member(building_id))
  with check (private.is_building_member(building_id));

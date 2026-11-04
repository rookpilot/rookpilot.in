-- The things in a room that need looking after: filters, alarms, the water heater.
create table public.items (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings (id) on delete cascade,
  space_id uuid not null,
  name text not null check (length(trim(name)) > 0),
  -- Which starter template it came from. Null for a custom item.
  template_key text,
  brand text not null default '',
  model text not null default '',
  installed_on date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  foreign key (space_id, building_id) references public.spaces (id, building_id) on delete cascade,
  unique (id, building_id)
);

create index items_building_id_idx on public.items (building_id);
create index items_space_id_idx on public.items (space_id);

alter table public.items enable row level security;
revoke all on table public.items from anon, authenticated;
grant select, insert, update, delete on table public.items to authenticated;

create policy "Members manage their buildings' items"
  on public.items for all to authenticated
  using (private.is_building_member(building_id))
  with check (private.is_building_member(building_id));

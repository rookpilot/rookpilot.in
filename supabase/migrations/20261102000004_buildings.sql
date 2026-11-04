create type public.building_type as enum (
  'house', 'apartment_condo', 'mobile_home', 'rental', 'gym', 'store_cafe', 'office', 'theater'
);
create type public.hemisphere as enum ('north', 'south');

create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  type public.building_type not null,
  address_line1 text not null default '',
  address_line2 text not null default '',
  city text not null default '',
  region text not null default '',
  postal_code text not null default '',
  country text not null default '',
  beds integer check (beds >= 0),
  -- Halves allowed: 2.5 baths.
  baths numeric(3, 1) check (baths >= 0),
  year_built integer check (year_built between 1600 and 2100),
  sqft integer check (sqft > 0),
  -- Decides when seasonal timers come due.
  hemisphere public.hemisphere not null default 'north',
  -- Whoever created it. They become its first owner (see building_members).
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.buildings enable row level security;
revoke all on table public.buildings from anon, authenticated;
grant select, insert, update, delete on table public.buildings to authenticated;

-- Seeing, editing, and deleting depend on membership, so those rules are in building_members.
create policy "People create buildings as themselves"
  on public.buildings for insert to authenticated
  with check (created_by = (select auth.uid()));

-- Who manages each building. A building can have many people, and a person many buildings.
create type public.member_role as enum ('owner', 'member');

create table public.building_members (
  building_id uuid not null references public.buildings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (building_id, user_id)
);

create index building_members_user_id_idx on public.building_members (user_id);

alter table public.building_members enable row level security;
revoke all on table public.building_members from anon, authenticated;
grant select, insert, update, delete on table public.building_members to authenticated;

-- Membership checks used by every building rule. They run as the table owner so the
-- rules on building_members itself don't get in the way.
create function private.is_building_member(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.building_members m
    where m.building_id = target and m.user_id = (select auth.uid())
  );
$$;

create function private.is_building_owner(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.building_members m
    where m.building_id = target and m.user_id = (select auth.uid()) and m.role = 'owner'
  );
$$;

grant execute on function private.is_building_member(uuid), private.is_building_owner(uuid) to authenticated;

-- Creating a building makes its creator the owner.
create function private.add_building_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by is not null then
    insert into public.building_members (building_id, user_id, role)
    values (new.id, new.created_by, 'owner');
  end if;
  return new;
end;
$$;

create trigger buildings_add_owner
  after insert on public.buildings
  for each row execute function private.add_building_owner();

-- Buildings
create policy "Members see their buildings"
  on public.buildings for select to authenticated
  -- The creator check lets "insert ... returning" see the new row before the owner row exists.
  using (private.is_building_member(id) or created_by = (select auth.uid()));

create policy "Members edit their buildings"
  on public.buildings for update to authenticated
  using (private.is_building_member(id))
  with check (private.is_building_member(id));

create policy "Owners delete their buildings"
  on public.buildings for delete to authenticated
  using (private.is_building_owner(id));

-- Members
create policy "Members see who else manages their buildings"
  on public.building_members for select to authenticated
  using (private.is_building_member(building_id));

create policy "Owners add people"
  on public.building_members for insert to authenticated
  with check (private.is_building_owner(building_id));

create policy "Owners change roles"
  on public.building_members for update to authenticated
  using (private.is_building_owner(building_id))
  with check (private.is_building_owner(building_id));

create policy "Owners remove people, and anyone can leave"
  on public.building_members for delete to authenticated
  using (private.is_building_owner(building_id) or user_id = (select auth.uid()));

-- Profiles: people who share a building see each other's names.
create policy "Members see each other's profiles"
  on public.profiles for select to authenticated
  using (
    exists (
      select 1
      from public.building_members mine
      join public.building_members theirs on theirs.building_id = mine.building_id
      where mine.user_id = (select auth.uid()) and theirs.user_id = profiles.id
    )
  );

-- Projects (add or improve something) and repairs (fix something that broke), in one table.
create type public.work_kind as enum ('project', 'repair');
-- Projects use idea, planning, in_progress, done. Repairs use open, in_progress, fixed.
create type public.work_status as enum ('idea', 'planning', 'open', 'in_progress', 'done', 'fixed');
create type public.performed_by as enum ('diy', 'hired');

create table public.work (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings (id) on delete cascade,
  kind public.work_kind not null,
  title text not null check (length(trim(title)) > 0),
  status public.work_status not null,
  space_id uuid,
  item_id uuid,
  performed_by public.performed_by not null default 'diy',
  cost numeric(12, 2) check (cost >= 0),
  -- Projects only.
  budget numeric(12, 2) check (budget >= 0),
  -- When a repair was reported, or a project started.
  started_on date,
  -- When a repair is scheduled, or a project's target date. Shows on the calendar.
  planned_on date,
  -- Set when the status becomes done or fixed.
  finished_on date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  -- Deleting the room or item keeps the work and just clears the link.
  foreign key (space_id, building_id) references public.spaces (id, building_id) on delete set null (space_id),
  foreign key (item_id, building_id) references public.items (id, building_id) on delete set null (item_id),
  check (
    (kind = 'project' and status in ('idea', 'planning', 'in_progress', 'done'))
    or (kind = 'repair' and status in ('open', 'in_progress', 'fixed'))
  ),
  check (kind = 'project' or budget is null),
  unique (id, building_id)
);

create index work_building_id_idx on public.work (building_id);

alter table public.work enable row level security;
revoke all on table public.work from anon, authenticated;
grant select, insert, update, delete on table public.work to authenticated;

create policy "Members manage their buildings' work"
  on public.work for all to authenticated
  using (private.is_building_member(building_id))
  with check (private.is_building_member(building_id));

-- "Helped by" tags on projects and repairs. Rules are in contact_sharing.
create table public.work_contacts (
  work_id uuid not null references public.work (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  primary key (work_id, contact_id)
);

create index work_contacts_contact_id_idx on public.work_contacts (contact_id);

alter table public.work_contacts enable row level security;
revoke all on table public.work_contacts from anon, authenticated;
grant select, insert, delete on table public.work_contacts to authenticated;

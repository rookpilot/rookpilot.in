-- Each time a timer was marked done. This is History.
create table public.log_entries (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings (id) on delete cascade,
  item_id uuid not null,
  -- Null when the timer was deleted after it was done.
  schedule_id uuid,
  -- The task's title when it was done, so renaming the timer later doesn't rewrite history.
  title text not null check (length(trim(title)) > 0),
  done_on date not null,
  note text not null default '',
  cost numeric(12, 2) check (cost >= 0),
  created_at timestamptz not null default now(),
  foreign key (item_id, building_id) references public.items (id, building_id) on delete cascade,
  foreign key (schedule_id, building_id) references public.schedules (id, building_id) on delete set null (schedule_id),
  unique (id, building_id)
);

create index log_entries_building_done_idx on public.log_entries (building_id, done_on desc);
create index log_entries_item_id_idx on public.log_entries (item_id);

alter table public.log_entries enable row level security;
revoke all on table public.log_entries from anon, authenticated;
grant select, insert, update, delete on table public.log_entries to authenticated;

create policy "Members manage their buildings' history"
  on public.log_entries for all to authenticated
  using (private.is_building_member(building_id))
  with check (private.is_building_member(building_id));

-- "Helped by" tags on history entries. Rules are in contact_sharing.
create table public.log_entry_contacts (
  log_entry_id uuid not null references public.log_entries (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  primary key (log_entry_id, contact_id)
);

create index log_entry_contacts_contact_id_idx on public.log_entry_contacts (contact_id);

alter table public.log_entry_contacts enable row level security;
revoke all on table public.log_entry_contacts from anon, authenticated;
grant select, insert, delete on table public.log_entry_contacts to authenticated;

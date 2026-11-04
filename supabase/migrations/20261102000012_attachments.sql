-- One row per uploaded file. The file itself is in Storage at storage_path.
create type public.attachment_kind as enum ('photo', 'receipt', 'manual', 'other');

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings (id) on delete cascade,
  -- What it's attached to: one of these, or none for a building-wide file.
  item_id uuid,
  work_id uuid,
  log_entry_id uuid,
  kind public.attachment_kind not null default 'other',
  storage_path text not null unique,
  file_name text not null,
  content_type text not null default '',
  size_bytes bigint check (size_bytes >= 0),
  uploaded_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (item_id, building_id) references public.items (id, building_id) on delete cascade,
  foreign key (work_id, building_id) references public.work (id, building_id) on delete cascade,
  foreign key (log_entry_id, building_id) references public.log_entries (id, building_id) on delete cascade,
  check (num_nonnulls(item_id, work_id, log_entry_id) <= 1)
);

create index attachments_building_id_idx on public.attachments (building_id);
create index attachments_item_id_idx on public.attachments (item_id) where item_id is not null;
create index attachments_work_id_idx on public.attachments (work_id) where work_id is not null;
create index attachments_log_entry_id_idx on public.attachments (log_entry_id) where log_entry_id is not null;

alter table public.attachments enable row level security;
revoke all on table public.attachments from anon, authenticated;
grant select, insert, update, delete on table public.attachments to authenticated;

create policy "Members manage their buildings' files"
  on public.attachments for all to authenticated
  using (private.is_building_member(building_id))
  with check (private.is_building_member(building_id));

-- The people who help keep your buildings running. They belong to an account, not a building.
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  company text not null default '',
  trade text not null default '',
  phone text not null default '',
  email text not null default '',
  -- Handle without the @.
  instagram text not null default '',
  -- Where the photo is kept in Storage. Null shows initials.
  photo_path text,
  why_we_like_them text not null default '',
  created_at timestamptz not null default now()
);

create index contacts_owner_id_idx on public.contacts (owner_id);

alter table public.contacts enable row level security;
revoke all on table public.contacts from anon, authenticated;
grant select, insert, update, delete on table public.contacts to authenticated;

-- Members of a shared building also see contacts tagged there: see contact_sharing.
create policy "People manage their own contacts"
  on public.contacts for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

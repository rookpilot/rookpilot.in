-- Contacts belong to one account, but people who share a building see the contacts
-- tagged on that building's projects, repairs, and history.

create function private.work_building(target uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select building_id from public.work where id = target;
$$;

create function private.log_entry_building(target uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select building_id from public.log_entries where id = target;
$$;

-- Yours, or tagged somewhere in a building you manage.
create function private.can_see_contact(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.contacts c where c.id = target and c.owner_id = (select auth.uid()))
    or exists (
      select 1 from public.work_contacts wc
      join public.work w on w.id = wc.work_id
      where wc.contact_id = target and private.is_building_member(w.building_id)
    )
    or exists (
      select 1 from public.log_entry_contacts lc
      join public.log_entries l on l.id = lc.log_entry_id
      where lc.contact_id = target and private.is_building_member(l.building_id)
    );
$$;

grant execute on function
  private.work_building(uuid), private.log_entry_building(uuid), private.can_see_contact(uuid)
  to authenticated;

create policy "Members see contacts tagged in their buildings"
  on public.contacts for select to authenticated
  using (private.can_see_contact(id));

-- Tags: members of the building can see and remove them, and can tag any contact they can see.
create policy "Members see work tags"
  on public.work_contacts for select to authenticated
  using (private.is_building_member(private.work_building(work_id)));

create policy "Members tag contacts on work"
  on public.work_contacts for insert to authenticated
  with check (private.is_building_member(private.work_building(work_id)) and private.can_see_contact(contact_id));

create policy "Members remove work tags"
  on public.work_contacts for delete to authenticated
  using (private.is_building_member(private.work_building(work_id)));

create policy "Members see history tags"
  on public.log_entry_contacts for select to authenticated
  using (private.is_building_member(private.log_entry_building(log_entry_id)));

create policy "Members tag contacts on history"
  on public.log_entry_contacts for insert to authenticated
  with check (private.is_building_member(private.log_entry_building(log_entry_id)) and private.can_see_contact(contact_id));

create policy "Members remove history tags"
  on public.log_entry_contacts for delete to authenticated
  using (private.is_building_member(private.log_entry_building(log_entry_id)));

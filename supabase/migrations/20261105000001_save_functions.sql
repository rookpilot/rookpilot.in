-- Saves that touch several tables at once. Each function runs as one transaction:
-- every part is saved, or none of it is. They run as the caller, so the access
-- rules still apply to every row. The app sends rows with ids it made itself;
-- missing values get the same defaults as the tables.

-- Finishing onboarding: the building, its rooms, items, and timers.
create or replace function public.create_building(building jsonb, spaces jsonb, items jsonb, schedules jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into public.buildings (
    id, name, type, address_line1, address_line2, city, region, postal_code, country,
    beds, baths, year_built, sqft, hemisphere
  )
  select id, name, type,
         coalesce(address_line1, ''), coalesce(address_line2, ''), coalesce(city, ''), coalesce(region, ''),
         coalesce(postal_code, ''), coalesce(country, ''),
         beds, baths, year_built, sqft, coalesce(hemisphere, 'north')
  from jsonb_populate_record(null::public.buildings, building);

  insert into public.spaces (id, building_id, name, kind, sort_order)
  select id, building_id, name, coalesce(kind, 'other'), coalesce(sort_order, 0)
  from jsonb_populate_recordset(null::public.spaces, spaces);

  perform public.add_items(items, schedules);
end;
$$;

-- Adding items with their starter timers.
create or replace function public.add_items(items jsonb, schedules jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into public.items (id, building_id, space_id, name, template_key, brand, model, installed_on, notes)
  select id, building_id, space_id, name, template_key,
         coalesce(brand, ''), coalesce(model, ''), installed_on, coalesce(notes, '')
  from jsonb_populate_recordset(null::public.items, items);

  insert into public.schedules (id, building_id, item_id, title, repeat, last_done_on, next_due_on, active)
  select id, building_id, item_id, title, repeat, last_done_on, next_due_on, coalesce(active, true)
  from jsonb_populate_recordset(null::public.schedules, schedules);
end;
$$;

-- Mark done: a history entry per timer, who helped, and each timer moved to its next due date.
-- Each completion: {"log": {log_entries row}, "contact_ids": [...], "last_done_on": "...", "next_due_on": "..."}
create or replace function public.complete_schedules(completions jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
  completion jsonb;
  entry public.log_entries;
begin
  for completion in select * from jsonb_array_elements(completions) loop
    entry := jsonb_populate_record(null::public.log_entries, completion -> 'log');

    insert into public.log_entries (id, building_id, item_id, schedule_id, title, done_on, note, cost)
    values (entry.id, entry.building_id, entry.item_id, entry.schedule_id, entry.title, entry.done_on, coalesce(entry.note, ''), entry.cost);

    insert into public.log_entry_contacts (log_entry_id, contact_id)
    select entry.id, contact_id::uuid
    from jsonb_array_elements_text(coalesce(completion -> 'contact_ids', '[]')) as contact_id;

    update public.schedules
    set last_done_on = (completion ->> 'last_done_on')::date,
        next_due_on = (completion ->> 'next_due_on')::date
    where id = entry.schedule_id;

    if not found then
      raise exception 'Timer % not found', entry.schedule_id using errcode = 'P0002';
    end if;
  end loop;
end;
$$;

-- Adding or editing a project or repair, and replacing its "Helped by" tags.
create or replace function public.save_work(work jsonb, contact_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
declare
  w public.work := jsonb_populate_record(null::public.work, work);
begin
  insert into public.work (
    id, building_id, kind, title, status, space_id, item_id, performed_by,
    cost, budget, started_on, planned_on, finished_on, notes
  )
  values (
    w.id, w.building_id, w.kind, w.title, w.status, w.space_id, w.item_id, coalesce(w.performed_by, 'diy'),
    w.cost, w.budget, w.started_on, w.planned_on, w.finished_on, coalesce(w.notes, '')
  )
  on conflict (id) do update set
    title = excluded.title,
    status = excluded.status,
    space_id = excluded.space_id,
    item_id = excluded.item_id,
    performed_by = excluded.performed_by,
    cost = excluded.cost,
    budget = excluded.budget,
    started_on = excluded.started_on,
    planned_on = excluded.planned_on,
    finished_on = excluded.finished_on,
    notes = excluded.notes;

  delete from public.work_contacts
  where work_id = w.id and contact_id <> all (contact_ids);

  insert into public.work_contacts (work_id, contact_id)
  select w.id, unnest(contact_ids)
  on conflict do nothing;
end;
$$;

revoke all on function
  public.create_building(jsonb, jsonb, jsonb, jsonb),
  public.add_items(jsonb, jsonb),
  public.complete_schedules(jsonb),
  public.save_work(jsonb, uuid[])
  from public, anon;

grant execute on function
  public.create_building(jsonb, jsonb, jsonb, jsonb),
  public.add_items(jsonb, jsonb),
  public.complete_schedules(jsonb),
  public.save_work(jsonb, uuid[])
  to authenticated;

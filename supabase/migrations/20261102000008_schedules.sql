-- The repeating timers on each item.
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings (id) on delete cascade,
  item_id uuid not null,
  title text not null check (length(trim(title)) > 0),
  -- Same shape the app uses:
  -- {"kind": "interval", "count": 3, "unit": "month"} or {"kind": "seasonal", "seasons": ["spring", "fall"]}
  repeat jsonb not null check (
    (repeat ->> 'kind' = 'interval'
      and (repeat ->> 'count')::integer > 0
      and repeat ->> 'unit' in ('day', 'week', 'month', 'year'))
    or (repeat ->> 'kind' = 'seasonal'
      and jsonb_typeof(repeat -> 'seasons') = 'array'
      and jsonb_array_length(repeat -> 'seasons') > 0)
  ),
  last_done_on date,
  next_due_on date not null,
  -- Paused timers keep their dates but don't show up as due.
  active boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (item_id, building_id) references public.items (id, building_id) on delete cascade,
  unique (id, building_id)
);

create index schedules_building_due_idx on public.schedules (building_id, next_due_on);
create index schedules_item_id_idx on public.schedules (item_id);

alter table public.schedules enable row level security;
revoke all on table public.schedules from anon, authenticated;
grant select, insert, update, delete on table public.schedules to authenticated;

create policy "Members manage their buildings' schedules"
  on public.schedules for all to authenticated
  using (private.is_building_member(building_id))
  with check (private.is_building_member(building_id));

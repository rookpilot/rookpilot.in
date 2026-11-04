-- A profile's id is always its account's id, never a random one.
alter table public.profiles alter column id drop default;

-- Every new account gets a profile, filled from what it signed up with
-- (the name on the sign-up form, or the name and photo from Google).
-- Helpers live in the private schema, which the API never exposes.
create schema if not exists private;
grant usage on schema private to authenticated;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Accounts made before this migration get a profile too.
insert into public.profiles (id, full_name, avatar_url)
select id,
       coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', ''),
       raw_user_meta_data ->> 'avatar_url'
from auth.users
on conflict (id) do nothing;

-- Profiles are only made by the trigger above, so signed-in people can read and edit but not add or delete.
revoke all on table public.profiles from anon, authenticated;
grant select, update on table public.profiles to authenticated;

create policy "People see their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "People edit their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

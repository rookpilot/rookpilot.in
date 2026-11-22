-- How often Rookpilot checks with the person before changing something (see lib/agent/confirm.ts).
-- Each person picks their own in Settings → Chat. Profiles already let people edit only their own row.
alter table public.profiles
  add column confirm_mode text not null default 'sometimes'
  constraint profiles_confirm_mode_check check (confirm_mode in ('rarely', 'sometimes', 'always'));

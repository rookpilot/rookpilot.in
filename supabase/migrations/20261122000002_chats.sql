-- Saved chats with Rookpilot.
--
-- Two parts:
--   1. public.chats: one row per chat, for the "past chats" list. Each person sees only their own.
--   2. The agent schema: LangGraph's saved conversation memory (messages, tool calls, a waiting
--      card). Only the server reads it, over a direct database connection. The API never exposes
--      this schema, and signed-in people get no access to it.
--
-- A chat's memory is saved under the thread id "<user id>:<chat id>" (see lib/agent/chat.ts).

-- 1. The chat list
create table public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  building_id uuid not null references public.buildings (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  created_at timestamptz not null default now(),
  -- Bumped on every message, so the list can show the latest chats first.
  updated_at timestamptz not null default now()
);

create index chats_user_building_updated_idx on public.chats (user_id, building_id, updated_at desc);
create index chats_building_id_idx on public.chats (building_id);

alter table public.chats enable row level security;
revoke all on table public.chats from anon, authenticated;
grant select, insert, delete on table public.chats to authenticated;
-- Only the title and the last-message time can change.
grant update (title, updated_at) on table public.chats to authenticated;

-- Private to each person, and only for buildings they still belong to.
create policy "People manage their own chats"
  on public.chats for all to authenticated
  using (user_id = (select auth.uid()) and private.is_building_member(building_id))
  with check (user_id = (select auth.uid()) and private.is_building_member(building_id));

-- 2. LangGraph's memory. These tables match what PostgresSaver.setup() from
-- @langchain/langgraph-checkpoint-postgres 1.1.4 creates. Its migration numbers are recorded at
-- the end, so setup() has nothing left to do if it's ever called.
create schema agent;
revoke all on schema agent from public, anon, authenticated;

create table agent.checkpoint_migrations (
  v integer primary key
);

create table agent.checkpoints (
  thread_id text not null,
  checkpoint_ns text not null default '',
  checkpoint_id text not null,
  parent_checkpoint_id text,
  type text,
  checkpoint jsonb not null,
  metadata jsonb not null default '{}',
  primary key (thread_id, checkpoint_ns, checkpoint_id)
);

create table agent.checkpoint_blobs (
  thread_id text not null,
  checkpoint_ns text not null default '',
  channel text not null,
  version text not null,
  type text not null,
  blob bytea,
  primary key (thread_id, checkpoint_ns, channel, version)
);

create table agent.checkpoint_writes (
  thread_id text not null,
  checkpoint_ns text not null default '',
  checkpoint_id text not null,
  task_id text not null,
  idx integer not null,
  channel text not null,
  type text,
  blob bytea not null,
  task_path text not null default '',
  primary key (thread_id, checkpoint_ns, checkpoint_id, task_id, idx)
);

insert into agent.checkpoint_migrations (v) values (0), (1), (2), (3), (4), (5);

-- Deleting a chat also deletes its memory, including when the person or building is deleted.
create function private.delete_chat_memory()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  thread text := old.user_id::text || ':' || old.id::text;
begin
  delete from agent.checkpoint_writes where thread_id = thread;
  delete from agent.checkpoint_blobs where thread_id = thread;
  delete from agent.checkpoints where thread_id = thread;
  return old;
end;
$$;

create trigger chats_delete_memory
  after delete on public.chats
  for each row execute function private.delete_chat_memory();

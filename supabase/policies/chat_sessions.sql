-- Enable RLS so every operation passes through the policies below.
alter table public.chat_sessions enable row level security;

drop policy if exists "Select own chat sessions" on public.chat_sessions;
drop policy if exists "Insert own chat sessions" on public.chat_sessions;
drop policy if exists "Delete own chat sessions" on public.chat_sessions;

-- Users can read only their own chat sessions.
create policy "Select own chat sessions"
  on public.chat_sessions
  for select
  using (auth.uid() = user_id);

-- Users can insert chat sessions that belong to them.
create policy "Insert own chat sessions"
  on public.chat_sessions
  for insert
  with check (auth.uid() = user_id);

-- Users can delete only their own chat sessions.
create policy "Delete own chat sessions"
  on public.chat_sessions
  for delete
  using (auth.uid() = user_id);


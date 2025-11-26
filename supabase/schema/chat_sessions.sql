alter table public.chat_sessions
  drop constraint if exists chat_sessions_user_id_fkey;

alter table public.chat_sessions
  add constraint chat_sessions_user_id_fkey
    foreign key (user_id) references auth.users(id)
    on delete cascade;


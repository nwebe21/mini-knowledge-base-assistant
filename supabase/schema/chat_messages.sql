alter table public.chat_messages
  drop constraint if exists chat_messages_user_id_fkey;

alter table public.chat_messages
  add constraint chat_messages_user_id_fkey
    foreign key (user_id) references auth.users(id)
    on delete cascade;


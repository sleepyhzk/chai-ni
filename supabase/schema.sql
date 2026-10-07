-- Chạy toàn bộ file này trong Supabase -> SQL Editor.
-- Mỗi người dùng chỉ đọc/ghi được dòng của chính mình (Row Level Security).

create table if not exists public.user_progress (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  card_key    text        not null,          -- khóa thẻ, vd '你好' hoặc '还#123' (chữ đa âm)
  state       jsonb       not null,          -- SrsState: easiness, interval, repetitions, nextReview, ...
  reviewed_at timestamptz not null,          -- lastReviewed, dùng để chọn bản mới hơn khi gộp
  primary key (user_id, card_key)
);

create table if not exists public.user_starred (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  card_key   text        not null,
  starred    boolean     not null,           -- false = đã bỏ sao (giữ lại để đồng bộ giữa các thiết bị)
  updated_at timestamptz not null,
  primary key (user_id, card_key)
);

alter table public.user_progress enable row level security;
alter table public.user_starred  enable row level security;

drop policy if exists "own progress" on public.user_progress;
create policy "own progress" on public.user_progress
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own starred" on public.user_starred;
create policy "own starred" on public.user_starred
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================
-- 训练日记 · Supabase 数据库初始化脚本（一次性执行）
-- 用法：Supabase 控制台 → SQL Editor → New query → 粘贴本文件全部内容 → Run
-- 内容：4 张表 + 索引 + 注册自动建资料 + RLS 行级隔离 + 头像存储桶
-- 特性：可重复执行（IF NOT EXISTS / ON CONFLICT），不会破坏已有数据
-- ============================================================

-- ---------- 1. 资料表（昵称/头像，与 auth.users 一对一） ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- 2. 训练记录 ----------
create table if not exists public.workouts (
  id text primary key,                       -- 与本机 App 生成的 id 一致，便于合并
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  started_at bigint not null,                -- 毫秒时间戳
  ended_at bigint not null,
  created_at timestamptz not null default now()
);
create index if not exists workouts_user_idx on public.workouts(user_id, started_at desc);

create table if not exists public.exercises (
  id text primary key,
  workout_id text not null references public.workouts(id) on delete cascade,
  exercise_id text,                          -- 动作库中的动作 id（自定义动作为本地 id）
  name text not null,
  cat text not null default '',
  type text not null default 'reps',         -- reps | time
  pos int not null default 0
);
create index if not exists exercises_workout_idx on public.exercises(workout_id);

create table if not exists public.sets (
  id text primary key,
  exercise_id text not null references public.exercises(id) on delete cascade,
  kg double precision not null default 0,
  reps int not null default 0,
  sec int not null default 0,
  at bigint not null default 0                -- 该组完成时间（毫秒时间戳）
);
create index if not exists sets_exercise_idx on public.sets(exercise_id);

-- ---------- 3. 新用户注册时自动创建资料行 ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data->>'nickname', ''))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 4. RLS 行级隔离（核心安全：用户只能读写自己的数据） ----------
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.exercises enable row level security;
alter table public.sets enable row level security;

-- ---------- 4.5 动作库快照（自定义动作 / 已移除的内置动作 / 自定义排序） ----------
-- 以前自定义动作只存本机，换设备或换入口（Safari 与主屏幕图标存储不互通）就会“消失”，
-- 因此单独一张表跟着账号走。custom 按 id 合并（并集，不会互相覆盖丢失），
-- hidden / ex_order 按 updated_at 取较新的一份。
create table if not exists public.exercise_lib (
  user_id uuid primary key references auth.users on delete cascade,
  custom jsonb not null default '[]'::jsonb,
  hidden jsonb not null default '[]'::jsonb,
  ex_order jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.exercise_lib enable row level security;

drop policy if exists "exercise_lib_all_own" on public.exercise_lib;
create policy "exercise_lib_all_own" on public.exercise_lib for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "workouts_all_own" on public.workouts;
create policy "workouts_all_own" on public.workouts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "exercises_all_own" on public.exercises;
create policy "exercises_all_own" on public.exercises for all
  using (exists (select 1 from public.workouts w where w.id = exercises.workout_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.workouts w where w.id = exercises.workout_id and w.user_id = auth.uid()));

drop policy if exists "sets_all_own" on public.sets;
create policy "sets_all_own" on public.sets for all
  using (exists (select 1 from public.exercises e join public.workouts w on w.id = e.workout_id
                 where e.id = sets.exercise_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.exercises e join public.workouts w on w.id = e.workout_id
                      where e.id = sets.exercise_id and w.user_id = auth.uid()));

-- ---------- 4.6 训练计划（自定义训练安排） ----------
-- 个人项目的计划数量很小，整份 plans/deleted 存一行的 jsonb 即可（与 exercise_lib 同模式）
create table if not exists public.plan_lib (
  user_id uuid primary key references auth.users on delete cascade,
  plans jsonb not null default '[]'::jsonb,
  deleted jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.plan_lib enable row level security;

drop policy if exists "plan_lib_all_own" on public.plan_lib;
create policy "plan_lib_all_own" on public.plan_lib for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- 5. 头像存储桶（公开读，仅本人可写自己的目录） ----------
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_public_read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- 6. 完成 ----------
-- 执行成功后可在 Table Editor 看到 profiles / workouts / exercises / sets / exercise_lib / plan_lib 六张表，
-- 在 Storage 看到 avatars 桶。App 端即可登录使用。

-- Enable RLS on core tables and add per-user policies

alter table public.user_profiles enable row level security;
alter table public.user_plans enable row level security;
alter table public.daily_logs enable row level security;
alter table public.content_exercises enable row level security;
alter table public.content_meals enable row level security;
alter table public.content_habits enable row level security;

-- user_profiles policies ----------------------------------------------------

drop policy if exists "Profiles are private" on public.user_profiles;
create policy "Profiles are private" on public.user_profiles
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users manage own profile" on public.user_profiles;
create policy "Users manage own profile" on public.user_profiles
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own profile" on public.user_profiles;
create policy "Users update own profile" on public.user_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own profile" on public.user_profiles;
create policy "Users delete own profile" on public.user_profiles
  for delete
  using (auth.uid() = user_id);

-- user_plans policies -------------------------------------------------------

drop policy if exists "Plans are private" on public.user_plans;
create policy "Plans are private" on public.user_plans
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users manage own plans" on public.user_plans;
create policy "Users manage own plans" on public.user_plans
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own plans" on public.user_plans;
create policy "Users update own plans" on public.user_plans
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own plans" on public.user_plans;
create policy "Users delete own plans" on public.user_plans
  for delete
  using (auth.uid() = user_id);

-- daily_logs policies -------------------------------------------------------

drop policy if exists "Logs are private" on public.daily_logs;
create policy "Logs are private" on public.daily_logs
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users manage own logs" on public.daily_logs;
create policy "Users manage own logs" on public.daily_logs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own logs" on public.daily_logs;
create policy "Users update own logs" on public.daily_logs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own logs" on public.daily_logs;
create policy "Users delete own logs" on public.daily_logs
  for delete
  using (auth.uid() = user_id);

-- Content tables (read-only) ------------------------------------------------

drop policy if exists "Authenticated read exercises" on public.content_exercises;
create policy "Authenticated read exercises" on public.content_exercises
  for select
  using (auth.uid() is not null);

drop policy if exists "Authenticated read meals" on public.content_meals;
create policy "Authenticated read meals" on public.content_meals
  for select
  using (auth.uid() is not null);

drop policy if exists "Authenticated read habits" on public.content_habits;
create policy "Authenticated read habits" on public.content_habits
  for select
  using (auth.uid() is not null);

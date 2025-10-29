-- Whop membership tracking and gating

create table if not exists public.whop_memberships (
  id uuid primary key default gen_random_uuid(),
  whop_membership_id text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  status text not null default 'unknown' check (status in (
    'active',
    'trialing',
    'grace',
    'past_due',
    'canceled',
    'expired',
    'unknown'
  )),
  plan_id text,
  plan_name text,
  entitlement_id text,
  entitlement_name text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  last_event_id text,
  raw_payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whop_memberships_user_id_idx on public.whop_memberships(user_id);
create index if not exists whop_memberships_status_idx on public.whop_memberships(status);

drop trigger if exists whop_memberships_set_updated_at on public.whop_memberships;
create trigger whop_memberships_set_updated_at
before update on public.whop_memberships
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.whop_memberships enable row level security;

drop policy if exists "Users view own membership" on public.whop_memberships;
create policy "Users view own membership" on public.whop_memberships
  for select
  using (auth.uid() = user_id);

create or replace function public.is_active_member(target_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.whop_memberships wm
    where wm.user_id = target_user_id
      and wm.status in ('active', 'trialing', 'grace')
      and (
        wm.current_period_end is null
        or wm.current_period_end >= now()
      )
  );
$$;

create or replace function public.get_membership_status()
returns table (
  status text,
  current_period_end timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(wm.status, 'inactive') as status,
    wm.current_period_end,
    wm.updated_at
  from public.whop_memberships wm
  where wm.user_id = auth.uid()
  order by wm.updated_at desc
  limit 1;
$$;

grant execute on function public.get_membership_status() to authenticated;

create or replace function public.claim_membership(v_email text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.whop_memberships
  set user_id = auth.uid()
  where lower(email) = lower(v_email)
    and (user_id is null or user_id = auth.uid());
$$;

grant execute on function public.claim_membership(text) to authenticated;

-- tighten plan and log policies to membership

drop policy if exists "Plans are private" on public.user_plans;
create policy "Plans are private" on public.user_plans
  for select
  using (
    auth.uid() = user_id
    and public.is_active_member(auth.uid())
  );

drop policy if exists "Users manage own plans" on public.user_plans;
create policy "Users manage own plans" on public.user_plans
  for insert
  with check (
    auth.uid() = user_id
    and public.is_active_member(auth.uid())
  );

drop policy if exists "Users update own plans" on public.user_plans;
create policy "Users update own plans" on public.user_plans
  for update
  using (
    auth.uid() = user_id
    and public.is_active_member(auth.uid())
  )
  with check (
    auth.uid() = user_id
    and public.is_active_member(auth.uid())
  );

drop policy if exists "Users delete own plans" on public.user_plans;
create policy "Users delete own plans" on public.user_plans
  for delete
  using (
    auth.uid() = user_id
    and public.is_active_member(auth.uid())
  );

drop policy if exists "Logs are private" on public.daily_logs;
create policy "Logs are private" on public.daily_logs
  for select
  using (
    auth.uid() = user_id
    and public.is_active_member(auth.uid())
  );

drop policy if exists "Users manage own logs" on public.daily_logs;
create policy "Users manage own logs" on public.daily_logs
  for insert
  with check (
    auth.uid() = user_id
    and public.is_active_member(auth.uid())
  );

drop policy if exists "Users update own logs" on public.daily_logs;
create policy "Users update own logs" on public.daily_logs
  for update
  using (
    auth.uid() = user_id
    and public.is_active_member(auth.uid())
  )
  with check (
    auth.uid() = user_id
    and public.is_active_member(auth.uid())
  );

drop policy if exists "Users delete own logs" on public.daily_logs;
create policy "Users delete own logs" on public.daily_logs
  for delete
  using (
    auth.uid() = user_id
    and public.is_active_member(auth.uid())
  );

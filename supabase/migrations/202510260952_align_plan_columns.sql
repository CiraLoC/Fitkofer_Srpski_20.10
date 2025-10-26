-- Ensure user_plans has columns referenced by triggers/app layer

alter table public.user_plans
  add column if not exists subscription_tier text default 'unselected',
  add column if not exists plan_created_at timestamptz,
  add column if not exists plan_start_date date,
  add column if not exists plan_end_date date;

comment on column public.user_plans.subscription_tier is 'mirror of plan->subscriptionTier';

-- Fitkofer core data schema

-- Ensure UUID generation is available
create extension if not exists "pgcrypto" with schema extensions;

set search_path = public;

-- Helper function: keep updated_at in sync
create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Helper function: convert jsonb array -> text[]
create or replace function public.jsonb_text_array(source jsonb)
returns text[]
language sql
immutable
as $$
  select coalesce(array_agg(value), array[]::text[])
  from jsonb_array_elements_text(coalesce(source, '[]'::jsonb)) as value;
$$;

-- user_profiles -------------------------------------------------------------

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null,
  age smallint check (age between 13 and 100),
  height_cm numeric(5,2) check (height_cm > 0),
  weight_kg numeric(6,2) check (weight_kg > 0),
  goal text check (goal in ('lose', 'maintain', 'gain')),
  activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'high')),
  equipment_location text check (equipment_location in ('home', 'gym')),
  equipment_items text[] not null default array[]::text[],
  days_per_week smallint check (days_per_week between 2 and 5),
  diet_preference text check (diet_preference in ('omnivore', 'pescatarian', 'vegetarian', 'mixed', 'keto', 'carnivore')),
  allergies text[] not null default array[]::text[],
  disliked_foods text[] not null default array[]::text[],
  sleep_hours numeric(4,1) check (sleep_hours between 0 and 24),
  stress_level smallint check (stress_level between 1 and 5),
  health_conditions text[] not null default array[]::text[],
  cycle_length_days smallint,
  period_length_days smallint,
  last_period_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.sync_user_profile_fields()
returns trigger
language plpgsql
as $$
begin
  if new.profile is null then
    return new;
  end if;

  new.age := nullif(new.profile->>'age', '')::smallint;
  new.height_cm := nullif(new.profile->>'heightCm', '')::numeric;
  new.weight_kg := nullif(new.profile->>'weightKg', '')::numeric;
  new.goal := nullif(new.profile->>'goal', '');
  new.activity_level := nullif(new.profile->>'activityLevel', '');
  new.equipment_location := nullif(new.profile #>> '{equipment,location}', '');
  new.equipment_items := public.jsonb_text_array(new.profile #> '{equipment,items}');
  new.days_per_week := nullif(new.profile->>'daysPerWeek', '')::smallint;
  new.diet_preference := nullif(new.profile->>'dietPreference', '');
  new.allergies := public.jsonb_text_array(new.profile->'allergies');
  new.disliked_foods := public.jsonb_text_array(new.profile->'dislikedFoods');
  new.sleep_hours := nullif(new.profile->>'sleepHours', '')::numeric;
  new.stress_level := nullif(new.profile->>'stressLevel', '')::smallint;
  new.health_conditions := public.jsonb_text_array(new.profile->'healthConditions');
  new.cycle_length_days := nullif(new.profile->>'cycleLengthDays', '')::smallint;
  new.period_length_days := nullif(new.profile->>'periodLengthDays', '')::smallint;
  if nullif(new.profile->>'lastPeriodDate', '') is not null then
    new.last_period_date := (new.profile->>'lastPeriodDate')::date;
  else
    new.last_period_date := null;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_user_profile_fields_trg on public.user_profiles;
create trigger sync_user_profile_fields_trg
before insert or update on public.user_profiles
for each row
execute function public.sync_user_profile_fields();

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row
execute function public.set_current_timestamp_updated_at();

-- user_plans ----------------------------------------------------------------

create table if not exists public.user_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan jsonb not null,
  subscription_tier text not null default 'unselected' check (subscription_tier in ('unselected', 'nutrition', 'training', 'habits', 'full')),
  plan_created_at timestamptz,
  plan_start_date date,
  plan_end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_plans_user_id_key on public.user_plans (user_id);

create or replace function public.sync_user_plan_fields()
returns trigger
language plpgsql
as $$
begin
  if new.plan is null then
    return new;
  end if;

  if new.plan ? 'subscriptionTier' then
    new.subscription_tier := coalesce(nullif(new.plan->>'subscriptionTier', ''), 'unselected');
  end if;

  if new.plan ? 'createdAt' then
    if nullif(new.plan->>'createdAt', '') is not null then
      new.plan_created_at := (new.plan->>'createdAt')::timestamptz;
    else
      new.plan_created_at := null;
    end if;
  end if;

  if new.plan ? 'subscriptionStart' then
    if nullif(new.plan->>'subscriptionStart', '') is not null then
      new.plan_start_date := ((new.plan->>'subscriptionStart')::timestamptz)::date;
    else
      new.plan_start_date := null;
    end if;
  end if;

  if new.plan ? 'subscriptionEnd' then
    if nullif(new.plan->>'subscriptionEnd', '') is not null then
      new.plan_end_date := ((new.plan->>'subscriptionEnd')::timestamptz)::date;
    else
      new.plan_end_date := null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_user_plan_fields_trg on public.user_plans;
create trigger sync_user_plan_fields_trg
before insert or update on public.user_plans
for each row
execute function public.sync_user_plan_fields();

drop trigger if exists user_plans_set_updated_at on public.user_plans;
create trigger user_plans_set_updated_at
before update on public.user_plans
for each row
execute function public.set_current_timestamp_updated_at();

-- daily_logs ----------------------------------------------------------------

create table if not exists public.daily_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  log jsonb not null,
  energy smallint,
  workouts_completed text[] not null default array[]::text[],
  meals_completed text[] not null default array[]::text[],
  habits_completed text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);

create or replace function public.sync_daily_log_fields()
returns trigger
language plpgsql
as $$
begin
  if new.log is null then
    return new;
  end if;

  new.energy := nullif(new.log->>'energy', '')::smallint;
  new.workouts_completed := public.jsonb_text_array(new.log->'workoutsCompleted');
  new.meals_completed := public.jsonb_text_array(new.log->'mealsCompleted');
  new.habits_completed := public.jsonb_text_array(new.log->'habitsCompleted');

  return new;
end;
$$;

drop trigger if exists sync_daily_log_fields_trg on public.daily_logs;
create trigger sync_daily_log_fields_trg
before insert or update on public.daily_logs
for each row
execute function public.sync_daily_log_fields();

drop trigger if exists daily_logs_set_updated_at on public.daily_logs;
create trigger daily_logs_set_updated_at
before update on public.daily_logs
for each row
execute function public.set_current_timestamp_updated_at();

-- content tables -------------------------------------------------------------

create table if not exists public.content_exercises (
  id text primary key,
  name text not null,
  focus text not null check (focus in ('upper', 'lower', 'full', 'core', 'cardio', 'push', 'pull', 'mobility')),
  equipment text not null,
  instructions text not null,
  sets smallint not null check (sets > 0),
  rep_range text not null,
  tempo text,
  rest_seconds smallint,
  goal_tags text[] not null default array[]::text[],
  health_tags text[] not null default array[]::text[],
  intensity text check (intensity in ('beginner', 'intermediate', 'advanced')),
  preferred_location text check (preferred_location in ('home', 'gym')),
  media jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists content_exercises_set_updated_at on public.content_exercises;
create trigger content_exercises_set_updated_at
before update on public.content_exercises
for each row
execute function public.set_current_timestamp_updated_at();

create index if not exists content_exercises_focus_idx on public.content_exercises (focus);
create index if not exists content_exercises_goal_tags_gin on public.content_exercises using gin (goal_tags);
create index if not exists content_exercises_health_tags_gin on public.content_exercises using gin (health_tags);

create table if not exists public.content_meals (
  id text primary key,
  title text not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack', 'dessert')),
  diet_types text[] not null default array[]::text[],
  calories integer check (calories >= 0),
  protein integer,
  carbs integer,
  fats integer,
  tags text[] not null default array[]::text[],
  ingredients jsonb not null,
  instructions text[] not null,
  image_url text,
  prep_time_minutes smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists content_meals_set_updated_at on public.content_meals;
create trigger content_meals_set_updated_at
before update on public.content_meals
for each row
execute function public.set_current_timestamp_updated_at();

create index if not exists content_meals_meal_type_idx on public.content_meals (meal_type);
create index if not exists content_meals_tags_gin on public.content_meals using gin (tags);
create index if not exists content_meals_diet_types_gin on public.content_meals using gin (diet_types);

create table if not exists public.content_habits (
  id text primary key,
  title text not null,
  description text not null,
  category text not null check (category in ('hydration', 'sleep', 'mobility', 'mindfulness', 'nutrition')),
  is_core boolean not null default false,
  locale text not null default 'sr-Latn',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists content_habits_set_updated_at on public.content_habits;
create trigger content_habits_set_updated_at
before update on public.content_habits
for each row
execute function public.set_current_timestamp_updated_at();

create index if not exists content_habits_category_idx on public.content_habits (category);

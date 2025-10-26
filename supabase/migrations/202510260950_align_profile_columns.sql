-- Ensure user_profiles has the columns expected by triggers/app

alter table public.user_profiles
  add column if not exists age smallint,
  add column if not exists height_cm numeric(5,2),
  add column if not exists weight_kg numeric(6,2),
  add column if not exists goal text,
  add column if not exists activity_level text,
  add column if not exists equipment_location text,
  add column if not exists equipment_items text[] not null default array[]::text[],
  add column if not exists days_per_week smallint,
  add column if not exists diet_preference text,
  add column if not exists allergies text[] not null default array[]::text[],
  add column if not exists disliked_foods text[] not null default array[]::text[],
  add column if not exists sleep_hours numeric(4,1),
  add column if not exists stress_level smallint,
  add column if not exists health_conditions text[] not null default array[]::text[],
  add column if not exists cycle_length_days smallint,
  add column if not exists period_length_days smallint,
  add column if not exists last_period_date date;

comment on column public.user_profiles.equipment_items is 'mirror of profile->equipment.items';
comment on column public.user_profiles.allergies is 'mirror of profile->allergies';
comment on column public.user_profiles.disliked_foods is 'mirror of profile->dislikedFoods';
comment on column public.user_profiles.health_conditions is 'mirror of profile->healthConditions';

-- Run this in Supabase SQL Editor.
-- It creates dashboard tables, RLS policies, and auto-profile creation from auth.users.

create extension if not exists "pgcrypto";

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  target_exam text default 'JEE Main & Advanced',
  current_streak integer not null default 0,
  points integer not null default 10320,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_analytics (
  user_id uuid primary key references auth.users(id) on delete cascade,
  predicted_rank_low integer,
  predicted_rank_high integer,
  estimated_score_low integer,
  estimated_score_high integer,
  confidence_label text default 'Medium-High',
  updated_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_name text not null,
  badge_detail text not null,
  earned_at timestamptz not null default now()
);

create table if not exists public.test_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  test_name text not null,
  attempted_at date not null default current_date,
  score numeric(6,2) not null,
  percentile numeric(6,2) not null
);

create table if not exists public.ai_insights (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  insight text not null,
  created_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
alter table public.user_analytics enable row level security;
alter table public.user_badges enable row level security;
alter table public.test_attempts enable row level security;
alter table public.ai_insights enable row level security;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
drop policy if exists "user_profiles_insert_own" on public.user_profiles;
drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_select_own" on public.user_profiles for select using (auth.uid() = user_id);
create policy "user_profiles_insert_own" on public.user_profiles for insert with check (auth.uid() = user_id);
create policy "user_profiles_update_own" on public.user_profiles for update using (auth.uid() = user_id);

drop policy if exists "user_analytics_select_own" on public.user_analytics;
drop policy if exists "user_analytics_insert_own" on public.user_analytics;
drop policy if exists "user_analytics_update_own" on public.user_analytics;
create policy "user_analytics_select_own" on public.user_analytics for select using (auth.uid() = user_id);
create policy "user_analytics_insert_own" on public.user_analytics for insert with check (auth.uid() = user_id);
create policy "user_analytics_update_own" on public.user_analytics for update using (auth.uid() = user_id);

drop policy if exists "user_badges_select_own" on public.user_badges;
drop policy if exists "user_badges_insert_own" on public.user_badges;
create policy "user_badges_select_own" on public.user_badges for select using (auth.uid() = user_id);
create policy "user_badges_insert_own" on public.user_badges for insert with check (auth.uid() = user_id);

drop policy if exists "test_attempts_select_own" on public.test_attempts;
drop policy if exists "test_attempts_insert_own" on public.test_attempts;
create policy "test_attempts_select_own" on public.test_attempts for select using (auth.uid() = user_id);
create policy "test_attempts_insert_own" on public.test_attempts for insert with check (auth.uid() = user_id);

drop policy if exists "ai_insights_select_own" on public.ai_insights;
drop policy if exists "ai_insights_insert_own" on public.ai_insights;
create policy "ai_insights_select_own" on public.ai_insights for select using (auth.uid() = user_id);
create policy "ai_insights_insert_own" on public.ai_insights for insert with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, full_name, avatar_url, target_exam, current_streak, points)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    'JEE Main & Advanced',
    0,
    10320
  )
  on conflict (user_id) do nothing;

  insert into public.user_analytics (
    user_id,
    predicted_rank_low,
    predicted_rank_high,
    estimated_score_low,
    estimated_score_high,
    confidence_label
  )
  values (new.id, 2100, 3200, 192, 205, 'Medium-High')
  on conflict (user_id) do nothing;

  insert into public.user_badges (user_id, badge_name, badge_detail)
  values
    (new.id, 'Precision Pilot', '85%+ accuracy in last 10 tests'),
    (new.id, 'Consistency Streak', 'Studied 14 days in a row'),
    (new.id, 'Speed Solver', 'Solved 50 problems under target time')
  on conflict do nothing;

  insert into public.ai_insights (user_id, insight)
  values
    (new.id, 'You are losing marks in integer-type chemistry questions due to rounding errors.'),
    (new.id, 'Your physics score rises 12-15 marks when you start with mechanics first.'),
    (new.id, 'Predicted JEE Main rank band: 2,100 - 3,200 based on your last 8 tests.')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Backfill for existing users who signed up before this script:
insert into public.user_profiles (user_id, full_name, avatar_url, target_exam, current_streak, points)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'),
  'JEE Main & Advanced',
  0,
  10320
from auth.users u
on conflict (user_id) do nothing;

insert into public.user_analytics (
  user_id,
  predicted_rank_low,
  predicted_rank_high,
  estimated_score_low,
  estimated_score_high,
  confidence_label
)
select u.id, 2100, 3200, 192, 205, 'Medium-High'
from auth.users u
on conflict (user_id) do nothing;

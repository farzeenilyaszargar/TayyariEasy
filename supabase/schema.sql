-- Run this in Supabase SQL Editor.
-- This schema powers auth, dashboard analytics, tests, resources, and leaderboard data.

create extension if not exists "pgcrypto";

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  target_exam text default 'JEE Main & Advanced',
  current_streak integer not null default 0,
  points integer not null default 0,
  tests_completed integer not null default 0,
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

create table if not exists public.tests_catalog (
  id text primary key,
  name text not null,
  subject text not null check (subject in ('Physics', 'Chemistry', 'Mathematics')),
  type text not null check (type in ('Topic', 'Full')),
  avg_score integer not null default 0,
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  attempts integer not null default 0,
  icon text not null default 'T',
  created_at timestamptz not null default now()
);

create table if not exists public.resources_library (
  id text primary key,
  title text not null,
  type text not null,
  size text not null,
  subject text not null check (subject in ('Physics', 'Chemistry', 'Mathematics')),
  category text not null check (category in ('Roadmaps', 'Strategies', 'Notes', 'Books', 'Problems', 'PYQs')),
  preview text not null,
  href text not null default '#',
  created_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
alter table public.user_analytics enable row level security;
alter table public.user_badges enable row level security;
alter table public.test_attempts enable row level security;
alter table public.ai_insights enable row level security;
alter table public.tests_catalog enable row level security;
alter table public.resources_library enable row level security;

drop policy if exists "user_profiles_select_public" on public.user_profiles;
drop policy if exists "user_profiles_insert_own" on public.user_profiles;
drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_select_public" on public.user_profiles for select using (true);
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

drop policy if exists "tests_catalog_public_select" on public.tests_catalog;
create policy "tests_catalog_public_select" on public.tests_catalog for select using (true);

drop policy if exists "resources_library_public_select" on public.resources_library;
create policy "resources_library_public_select" on public.resources_library for select using (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, full_name, avatar_url, target_exam, current_streak, points, tests_completed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    'JEE Main & Advanced',
    0,
    0,
    0
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
  values (new.id, null, null, null, null, 'Not available')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.handle_test_attempt_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_profiles
  set
    tests_completed = coalesce(tests_completed, 0) + 1,
    points = coalesce(points, 0) + coalesce(new.score, 0)::int,
    current_streak = coalesce(current_streak, 0) + 1,
    updated_at = now()
  where user_id = new.user_id;

  return new;
end;
$$;

drop trigger if exists on_test_attempt_insert on public.test_attempts;
create trigger on_test_attempt_insert
after insert on public.test_attempts
for each row execute procedure public.handle_test_attempt_insert();

-- Backfill for existing users.
insert into public.user_profiles (user_id, full_name, avatar_url, target_exam, current_streak, points, tests_completed)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'),
  'JEE Main & Advanced',
  0,
  0,
  0
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
select u.id, null, null, null, null, 'Not available'
from auth.users u
on conflict (user_id) do nothing;

-- Recompute points/tests from actual attempts only (no synthetic scoring).
update public.user_profiles p
set
  tests_completed = coalesce(a.tests_count, 0),
  points = coalesce(a.score_sum, 0),
  updated_at = now()
from (
  select
    user_id,
    count(*)::int as tests_count,
    sum(score)::int as score_sum
  from public.test_attempts
  group by user_id
) a
where p.user_id = a.user_id;

-- Seed tests catalog.
insert into public.tests_catalog (id, name, subject, type, avg_score, difficulty, attempts, icon)
values
  ('phy-kinematics', 'Kinematics and Laws of Motion', 'Physics', 'Topic', 74, 'Medium', 8421, 'P'),
  ('phy-electro', 'Electrostatics and Current Electricity', 'Physics', 'Topic', 69, 'Hard', 6955, 'P'),
  ('chem-organic', 'Organic Reaction Mechanisms', 'Chemistry', 'Topic', 77, 'Medium', 9023, 'C'),
  ('math-calculus', 'Calculus: Limits, AOD, Integrals', 'Mathematics', 'Topic', 71, 'Hard', 8114, 'M'),
  ('math-coordinate', 'Coordinate Geometry', 'Mathematics', 'Topic', 79, 'Medium', 7331, 'M'),
  ('full-main-a', 'JEE Main Full Mock A', 'Physics', 'Full', 186, 'Medium', 4102, 'F'),
  ('full-main-b', 'JEE Main Full Mock B', 'Chemistry', 'Full', 178, 'Hard', 3820, 'F'),
  ('full-main-c', 'JEE Main Full Mock C', 'Mathematics', 'Full', 192, 'Medium', 4299, 'F'),
  ('full-adv-pattern', 'JEE Advanced Pattern Test', 'Physics', 'Full', 154, 'Hard', 2440, 'A')
on conflict (id) do update
set
  name = excluded.name,
  subject = excluded.subject,
  type = excluded.type,
  avg_score = excluded.avg_score,
  difficulty = excluded.difficulty,
  attempts = excluded.attempts,
  icon = excluded.icon;

-- Seed resources library.
insert into public.resources_library (id, title, type, size, subject, category, preview, href)
values
  ('res-roadmap-90', 'JEE 90-Day Master Roadmap', 'PDF', '1.2 MB', 'Mathematics', 'Roadmaps', 'Week-by-week roadmap for full syllabus completion and spaced revisions.', '#'),
  ('res-strategy-30', 'Last 30 Days Strategy Playbook', 'PDF', '980 KB', 'Physics', 'Strategies', 'Daily strategy blocks for mocks, analysis, and high-retention revision loops.', '#'),
  ('res-notes-org', 'Organic Chemistry Rapid Notes', 'PDF', '2.2 MB', 'Chemistry', 'Notes', 'Named reactions, mechanisms, and conversion maps in concise memory format.', '#'),
  ('res-notes-phy', 'Physics Formula Sheet', 'PDF', '1.4 MB', 'Physics', 'Notes', 'High-frequency formulas from mechanics, optics, modern physics, and electrostatics.', '#'),
  ('res-books-priority', 'Best Books by Chapter Priority', 'PDF', '1.1 MB', 'Mathematics', 'Books', 'Recommended books chapter-wise with easy, medium, and hard progression sequence.', '#'),
  ('res-problems-300', 'Top 300 Mixed Problems', 'PDF', '2.0 MB', 'Mathematics', 'Problems', 'Curated mixed-level problems with time targets and solving approach hints.', '#'),
  ('res-pyq-main', 'JEE Main PYQ Pack (2019-2025)', 'PDF', '4.8 MB', 'Physics', 'PYQs', 'Chapter-sorted PYQs with attempt order recommendations and trend analysis.', '#'),
  ('res-pyq-adv', 'JEE Advanced PYQ Matrix', 'PDF', '3.9 MB', 'Chemistry', 'PYQs', 'Question matrix by topic and difficulty with pattern insights from recent years.', '#')
on conflict (id) do update
set
  title = excluded.title,
  type = excluded.type,
  size = excluded.size,
  subject = excluded.subject,
  category = excluded.category,
  preview = excluded.preview,
  href = excluded.href;

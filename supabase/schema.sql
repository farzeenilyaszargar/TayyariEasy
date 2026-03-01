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

-- =====================================================
-- Test Bank Platform (Phase 0 + Phase 1 schema)
-- =====================================================

create table if not exists public.question_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_url text not null,
  license_type text not null check (license_type in ('official', 'open', 'unknown')),
  is_active boolean not null default true,
  robots_allowed boolean not null default false,
  terms_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.source_documents (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.question_sources(id) on delete cascade,
  url text not null unique,
  document_type text not null check (document_type in ('pdf', 'html')),
  published_year integer,
  exam text check (exam in ('JEE Main', 'JEE Advanced')),
  paper_code text,
  storage_path text,
  fetched_at timestamptz,
  content_hash text,
  parse_status text not null default 'pending' check (parse_status in ('pending', 'parsed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_bank (
  id uuid primary key default gen_random_uuid(),
  question_type text not null check (question_type in ('mcq_single', 'integer')),
  stem_markdown text not null,
  stem_latex text,
  diagram_image_url text,
  diagram_caption text,
  subject text not null check (subject in ('Physics', 'Chemistry', 'Mathematics')),
  topic text not null,
  subtopic text,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  source_kind text not null check (source_kind in ('historical', 'hard_curated', 'ai_generated')),
  exam_year integer,
  exam_phase text check (exam_phase in ('Main', 'Advanced')),
  marks integer not null default 4,
  negative_marks integer not null default 1,
  quality_score numeric(5,2) not null default 0,
  review_status text not null default 'needs_review' check (review_status in ('auto_pass', 'needs_review', 'approved', 'rejected')),
  ai_vetted_at timestamptz,
  ai_vetting_score numeric(5,2),
  ai_vetting_notes text,
  is_published boolean not null default false,
  dedupe_fingerprint text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.question_bank(id) on delete cascade,
  option_key text not null check (option_key in ('A', 'B', 'C', 'D')),
  option_text_markdown text not null,
  option_latex text,
  created_at timestamptz not null default now(),
  unique (question_id, option_key)
);

create table if not exists public.question_answers (
  question_id uuid primary key references public.question_bank(id) on delete cascade,
  answer_type text not null check (answer_type in ('option_key', 'integer_value')),
  correct_option text check (correct_option in ('A', 'B', 'C', 'D')),
  correct_integer numeric,
  solution_markdown text,
  solution_latex text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_provenance (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.question_bank(id) on delete cascade,
  source_document_id uuid references public.source_documents(id) on delete set null,
  source_question_ref text,
  source_url text not null,
  extraction_confidence numeric(5,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.syllabus_topics (
  id uuid primary key default gen_random_uuid(),
  subject text not null check (subject in ('Physics', 'Chemistry', 'Mathematics')),
  topic text not null,
  subtopic text,
  syllabus_version text not null default 'jee_main_2026',
  created_at timestamptz not null default now(),
  unique (subject, topic, subtopic, syllabus_version)
);

create table if not exists public.question_topic_map (
  question_id uuid not null references public.question_bank(id) on delete cascade,
  topic_id uuid not null references public.syllabus_topics(id) on delete cascade,
  confidence numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  primary key (question_id, topic_id)
);

create table if not exists public.question_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  target_subject text not null check (target_subject in ('Physics', 'Chemistry', 'Mathematics')),
  target_topic text not null,
  target_subtopic text,
  target_difficulty text not null check (target_difficulty in ('easy', 'medium', 'hard')),
  requested_count integer not null default 0,
  model text not null,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generated_question_meta (
  question_id uuid primary key references public.question_bank(id) on delete cascade,
  generation_job_id uuid references public.question_generation_jobs(id) on delete set null,
  prompt_template_version text not null,
  model text not null,
  validation_report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.test_blueprints (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scope text not null check (scope in ('topic', 'subject', 'full_mock')),
  subject text check (subject in ('Physics', 'Chemistry', 'Mathematics')),
  topic text,
  question_count integer not null,
  distribution jsonb not null default '{"easy":30,"medium":50,"hard":20}'::jsonb,
  duration_minutes integer not null,
  negative_marking boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.test_instances (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references public.test_blueprints(id) on delete cascade,
  version integer not null default 1,
  seed text,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.test_instance_questions (
  test_instance_id uuid not null references public.test_instances(id) on delete cascade,
  question_id uuid not null references public.question_bank(id) on delete cascade,
  position integer not null,
  created_at timestamptz not null default now(),
  primary key (test_instance_id, question_id)
);

create table if not exists public.question_review_queue (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.question_bank(id) on delete cascade,
  reason_codes text[] not null default '{}',
  priority integer not null default 5,
  assigned_to uuid,
  status text not null default 'open' check (status in ('open', 'approved', 'rejected')),
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_question_bank_publish_scope on public.question_bank (is_published, subject, topic, difficulty);
create index if not exists idx_question_bank_exam on public.question_bank (exam_year, exam_phase);
create index if not exists idx_question_bank_ai_vetted on public.question_bank (ai_vetted_at, ai_vetting_score);
create index if not exists idx_question_review_queue_status on public.question_review_queue (status, priority, created_at);
create index if not exists idx_test_blueprints_scope on public.test_blueprints (is_active, scope, subject, topic);

alter table public.question_sources enable row level security;
alter table public.source_documents enable row level security;
alter table public.question_bank enable row level security;
alter table public.question_options enable row level security;
alter table public.question_answers enable row level security;
alter table public.question_provenance enable row level security;
alter table public.syllabus_topics enable row level security;
alter table public.question_topic_map enable row level security;
alter table public.question_generation_jobs enable row level security;
alter table public.generated_question_meta enable row level security;
alter table public.test_blueprints enable row level security;
alter table public.test_instances enable row level security;
alter table public.test_instance_questions enable row level security;
alter table public.question_review_queue enable row level security;

drop policy if exists "question_bank_public_select_published" on public.question_bank;
create policy "question_bank_public_select_published" on public.question_bank
for select using (is_published = true);

drop policy if exists "question_options_public_select" on public.question_options;
create policy "question_options_public_select" on public.question_options
for select using (
  exists (
    select 1 from public.question_bank qb where qb.id = question_id and qb.is_published = true
  )
);

drop policy if exists "question_answers_public_select" on public.question_answers;
create policy "question_answers_public_select" on public.question_answers
for select using (
  exists (
    select 1 from public.question_bank qb where qb.id = question_id and qb.is_published = true
  )
);

drop policy if exists "syllabus_topics_public_select" on public.syllabus_topics;
create policy "syllabus_topics_public_select" on public.syllabus_topics for select using (true);

drop policy if exists "question_topic_map_public_select" on public.question_topic_map;
create policy "question_topic_map_public_select" on public.question_topic_map
for select using (
  exists (
    select 1 from public.question_bank qb where qb.id = question_id and qb.is_published = true
  )
);

drop policy if exists "test_blueprints_public_select" on public.test_blueprints;
create policy "test_blueprints_public_select" on public.test_blueprints for select using (is_active = true);

drop policy if exists "test_instances_public_select" on public.test_instances;
create policy "test_instances_public_select" on public.test_instances for select using (true);

drop policy if exists "test_instance_questions_public_select" on public.test_instance_questions;
create policy "test_instance_questions_public_select" on public.test_instance_questions for select using (true);

-- Note: insert/update/delete for the new platform tables are intentionally done via service role.

insert into public.test_blueprints (name, scope, subject, topic, question_count, distribution, duration_minutes, negative_marking, is_active)
values
  ('Physics Mechanics Topic Test', 'topic', 'Physics', 'Mechanics', 20, '{"easy":30,"medium":50,"hard":20}', 45, true, true),
  ('Chemistry Subject Test', 'subject', 'Chemistry', null, 30, '{"easy":25,"medium":50,"hard":25}', 60, true, true),
  ('JEE Full Mock Standard', 'full_mock', null, null, 75, '{"easy":30,"medium":50,"hard":20}', 180, true, true)
on conflict do nothing;

-- Expanded blueprint library for richer tests catalog.
insert into public.test_blueprints (id, name, scope, subject, topic, question_count, distribution, duration_minutes, negative_marking, is_active)
values
  ('6ea0a10f-8e14-44ff-8f48-2bff2d35f101', 'Physics Subject Master Test', 'subject', 'Physics', null, 30, '{"easy":25,"medium":50,"hard":25}', 60, true, true),
  ('6ea0a10f-8e14-44ff-8f48-2bff2d35f102', 'Chemistry Subject Master Test', 'subject', 'Chemistry', null, 30, '{"easy":25,"medium":50,"hard":25}', 60, true, true),
  ('6ea0a10f-8e14-44ff-8f48-2bff2d35f103', 'Mathematics Subject Master Test', 'subject', 'Mathematics', null, 30, '{"easy":20,"medium":50,"hard":30}', 60, true, true),
  ('6ea0a10f-8e14-44ff-8f48-2bff2d35f201', 'All India Full Syllabus Mock 01', 'full_mock', null, null, 75, '{"easy":30,"medium":50,"hard":20}', 180, true, true),
  ('6ea0a10f-8e14-44ff-8f48-2bff2d35f202', 'All India Full Syllabus Mock 02', 'full_mock', null, null, 75, '{"easy":28,"medium":50,"hard":22}', 180, true, true),
  ('6ea0a10f-8e14-44ff-8f48-2bff2d35f203', 'All India Full Syllabus Mock 03', 'full_mock', null, null, 75, '{"easy":25,"medium":50,"hard":25}', 180, true, true),
  ('6ea0a10f-8e14-44ff-8f48-2bff2d35f301', 'Mechanics Topic Series', 'topic', 'Physics', 'Mechanics', 20, '{"easy":30,"medium":50,"hard":20}', 45, true, true),
  ('6ea0a10f-8e14-44ff-8f48-2bff2d35f302', 'Electrodynamics Topic Series', 'topic', 'Physics', 'Electrodynamics', 20, '{"easy":25,"medium":50,"hard":25}', 45, true, true),
  ('6ea0a10f-8e14-44ff-8f48-2bff2d35f303', 'Organic Chemistry Topic Series', 'topic', 'Chemistry', 'Organic Chemistry', 20, '{"easy":25,"medium":50,"hard":25}', 45, true, true),
  ('6ea0a10f-8e14-44ff-8f48-2bff2d35f304', 'Physical Chemistry Topic Series', 'topic', 'Chemistry', 'Physical Chemistry', 20, '{"easy":30,"medium":50,"hard":20}', 45, true, true),
  ('6ea0a10f-8e14-44ff-8f48-2bff2d35f305', 'Calculus Topic Series', 'topic', 'Mathematics', 'Calculus', 20, '{"easy":20,"medium":50,"hard":30}', 45, true, true),
  ('6ea0a10f-8e14-44ff-8f48-2bff2d35f306', 'Algebra Topic Series', 'topic', 'Mathematics', 'Algebra', 20, '{"easy":25,"medium":50,"hard":25}', 45, true, true)
on conflict (id) do update
set
  name = excluded.name,
  scope = excluded.scope,
  subject = excluded.subject,
  topic = excluded.topic,
  question_count = excluded.question_count,
  distribution = excluded.distribution,
  duration_minutes = excluded.duration_minutes,
  negative_marking = excluded.negative_marking,
  is_active = excluded.is_active,
  updated_at = now();

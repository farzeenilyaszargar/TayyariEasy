-- Adds AI vetting metadata and diagram support for questions.

alter table if exists public.question_bank
  add column if not exists diagram_image_url text,
  add column if not exists diagram_caption text,
  add column if not exists ai_vetted_at timestamptz,
  add column if not exists ai_vetting_score numeric(5,2),
  add column if not exists ai_vetting_notes text;

create index if not exists idx_question_bank_ai_vetted on public.question_bank (ai_vetted_at, ai_vetting_score);

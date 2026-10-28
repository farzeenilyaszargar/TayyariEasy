// All client-side reads/writes to Supabase go through here.
import { supabase } from "./supabase/client";
import type {
  AnswerKey, AnswerRecord, Attempt, Badge, EarnedBadge, LeaderboardEntry, LeaderboardKind, Profile, Question, TestPaper,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const toAttempt = (r: any): Attempt => ({
  id: r.id,
  testId: r.test_id,
  startedAt: r.started_at,
  submittedAt: r.submitted_at,
  answers: r.answers ?? {},
  score: r.score,
  maxScore: r.max_score,
  correct: r.correct,
  wrong: r.wrong,
  skipped: r.skipped,
  summary: r.summary,
});

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function fetchCatalog() {
  const db = supabase();
  const [tests, links, questions] = await Promise.all([
    db.from("tests").select("*").order("released_at", { ascending: false }),
    db.from("test_questions").select("test_id, question_id, position").order("position"),
    db.from("questions").select("*"),
  ]);
  fail(tests.error); fail(links.error); fail(questions.error);

  const ids = new Map<string, string[]>();
  for (const l of links.data!) ids.set(l.test_id, [...(ids.get(l.test_id) ?? []), l.question_id]);

  const testList: TestPaper[] = tests.data!.map((t: any) => ({
    id: t.id, title: t.title, kind: t.kind, subject: t.subject, description: t.description,
    durationMin: t.duration_min, releasedAt: t.released_at, questionIds: ids.get(t.id) ?? [],
  }));
  const questionMap: Record<string, Question> = Object.fromEntries(
    questions.data!.map((q: any) => [q.id, {
      id: q.id, subject: q.subject, chapter: q.chapter, difficulty: q.difficulty, type: q.type, text: q.text,
      options: q.options, imageUrl: q.image_url, idealTimeSec: q.ideal_time_sec,
    }]),
  );
  return { tests: testList, questionMap };
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase().from("profiles").select("*").eq("id", userId).maybeSingle();
  fail(error);
  if (!data) return null;
  const active = data.plan === "pro" && (!data.pro_until || new Date(data.pro_until) > new Date());
  return {
    id: data.id, name: data.full_name, email: data.email, phone: data.phone, targetYear: data.target_year,
    plan: active ? "pro" : "free", proUntil: data.pro_until, points: data.points,
  };
}

export async function updateProfile(userId: string, patch: { full_name?: string; target_year?: number | null }) {
  const { error } = await supabase().from("profiles").update(patch).eq("id", userId);
  fail(error);
}

export async function fetchMyAttempts(): Promise<Attempt[]> {
  const { data, error } = await supabase().from("attempts").select("*").order("started_at", { ascending: false });
  fail(error);
  return data!.map(toAttempt);
}

export async function fetchAttempt(id: string): Promise<Attempt | null> {
  const { data, error } = await supabase().from("attempts").select("*").eq("id", id).maybeSingle();
  fail(error);
  return data ? toAttempt(data) : null;
}

export async function startAttempt(testId: string): Promise<Attempt> {
  const { data, error } = await supabase().rpc("start_attempt", { p_test_id: testId });
  fail(error);
  return toAttempt(data);
}

export async function saveProgress(attemptId: string, answers: Record<string, AnswerRecord>) {
  const { error } = await supabase().rpc("save_attempt_progress", { p_attempt_id: attemptId, p_answers: answers });
  fail(error);
}

export async function submitAttempt(attemptId: string, answers: Record<string, AnswerRecord>) {
  const { data, error } = await supabase().rpc("submit_attempt", { p_attempt_id: attemptId, p_answers: answers });
  fail(error);
  return data as { score: number; max_score: number; points: number; new_badges: string[] };
}

export async function fetchReview(attemptId: string): Promise<Record<string, AnswerKey>> {
  const { data, error } = await supabase().rpc("get_attempt_review", { p_attempt_id: attemptId });
  fail(error);
  return data ?? {};
}

export async function fetchLeaderboard(kind: LeaderboardKind, testId?: string, limit = 50): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase().rpc("leaderboard", { p_kind: kind, p_test_id: testId ?? null, p_limit: limit });
  fail(error);
  return (data ?? []).map((r: any) => ({
    rank: Number(r.rank), userId: r.user_id, name: r.name, score: Number(r.score), testsTaken: Number(r.tests_taken), isYou: r.is_you,
  }));
}

export async function fetchBadges(): Promise<Badge[]> {
  const { data, error } = await supabase().from("badges").select("*").order("sort");
  fail(error);
  return data as Badge[];
}

export async function fetchMyBadges(): Promise<EarnedBadge[]> {
  const { data, error } = await supabase().from("user_badges").select("badge_id, earned_at");
  fail(error);
  return data!.map((r: any) => ({ badgeId: r.badge_id, earnedAt: r.earned_at }));
}

export async function fetchPointsHistory() {
  const { data, error } = await supabase().from("points_ledger").select("*").order("created_at", { ascending: false }).limit(20);
  fail(error);
  return data as { id: number; delta: number; reason: string; ref: string | null; created_at: string }[];
}

// Postgres exception codes from our RPCs → friendly messages.
export function friendlyError(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  if (m.includes("WEEKLY_LIMIT")) return "You've used your free tests for this week. They reset on Monday — or go Pro for unlimited tests.";
  if (m.includes("NOT_AUTHENTICATED")) return "Please log in again.";
  if (m.includes("ALREADY_SUBMITTED")) return "This test was already submitted.";
  return m;
}

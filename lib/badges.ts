import { TEST_MAP } from "@/data/tests";
import { testLeaderboard, rankOf } from "./leaderboard";
import { analyze } from "./scoring";
import type { Attempt, Subject, User } from "./types";

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  // returns progress 0..1 (1 = earned)
  progress: (ctx: BadgeContext) => number;
}

interface BadgeContext {
  user: User;
  attempts: Attempt[]; // submitted only
}

const count = (n: number, target: number) => Math.min(1, n / target);

const subjectAce = (subject: Subject) => (ctx: BadgeContext) =>
  ctx.attempts.some((a) => {
    const b = analyze(a).bySubject.find((s) => s.key === subject);
    return b && b.total >= 5 && b.score / b.maxScore >= 0.9;
  }) ? 1 : 0;

const distinctDays = (attempts: Attempt[]) => new Set(attempts.map((a) => a.submittedAt!.slice(0, 10))).size;

export const BADGES: Badge[] = [
  { id: "first-step", name: "First Step", emoji: "🚀", description: "Complete your first test.",
    progress: (c) => count(c.attempts.length, 1) },
  { id: "hat-trick", name: "Hat-trick", emoji: "🎩", description: "Complete 3 tests.",
    progress: (c) => count(c.attempts.length, 3) },
  { id: "decathlete", name: "Decathlete", emoji: "🏅", description: "Complete 10 tests.",
    progress: (c) => count(c.attempts.length, 10) },
  { id: "full-mock", name: "Marathoner", emoji: "🏃", description: "Finish a full-length mock test.",
    progress: (c) => (c.attempts.some((a) => TEST_MAP[a.testId]?.kind === "full") ? 1 : 0) },
  { id: "physics-ace", name: "Physics Phenom", emoji: "⚛️", description: "Score 90%+ in Physics in any test.",
    progress: subjectAce("Physics") },
  { id: "chem-ace", name: "Chem Champ", emoji: "🧪", description: "Score 90%+ in Chemistry in any test.",
    progress: subjectAce("Chemistry") },
  { id: "maths-ace", name: "Math Maverick", emoji: "📐", description: "Score 90%+ in Mathematics in any test.",
    progress: subjectAce("Mathematics") },
  { id: "sharpshooter", name: "Sharpshooter", emoji: "🎯", description: "90%+ accuracy with at least 5 questions attempted.",
    progress: (c) => (c.attempts.some((a) => { const x = analyze(a); return x.correct + x.wrong >= 5 && x.accuracy >= 0.9; }) ? 1 : 0) },
  { id: "no-guesswork", name: "No Guesswork", emoji: "🧘", description: "Finish a test of 10+ questions with zero negative marks.",
    progress: (c) => (c.attempts.some((a) => { const x = analyze(a); return x.results.length >= 10 && x.negativeMarks === 0 && x.correct > 0; }) ? 1 : 0) },
  { id: "consistent", name: "Consistency King", emoji: "📅", description: "Give tests on 3 different days.",
    progress: (c) => count(distinctDays(c.attempts), 3) },
  { id: "top-10", name: "Top 10", emoji: "🏆", description: "Rank in the top 10 on any test leaderboard.",
    progress: (c) => (c.attempts.some((a) => { const r = rankOf(testLeaderboard(a.testId, c.user, c.attempts), c.user.id); return r !== null && r <= 10; }) ? 1 : 0) },
  { id: "night-owl", name: "Night Owl", emoji: "🦉", description: "Submit a test between midnight and 4 AM.",
    progress: (c) => (c.attempts.some((a) => new Date(a.submittedAt!).getHours() < 4) ? 1 : 0) },
];

export function badgeStatus(user: User, attempts: Attempt[]) {
  const ctx = { user, attempts: attempts.filter((a) => a.submittedAt) };
  return BADGES.map((b) => {
    const p = b.progress(ctx);
    return { badge: b, progress: p, earned: p >= 1 };
  });
}

export function earnedBadgeIds(user: User, attempts: Attempt[]) {
  return new Set(badgeStatus(user, attempts).filter((b) => b.earned).map((b) => b.badge.id));
}

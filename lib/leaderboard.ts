// Leaderboards. Until Supabase is wired up, other students are simulated with
// deterministic seeded data so rankings look stable between page loads.
import { TESTS, TEST_MAP } from "@/data/tests";
import { MARKS_CORRECT } from "./config";
import { startOfWeek } from "./quota";
import type { Attempt, LeaderboardEntry, User } from "./types";

const NAMES = [
  "Aarav Sharma", "Ananya Iyer", "Vihaan Gupta", "Diya Reddy", "Arjun Mehta", "Ishita Verma",
  "Kabir Singh", "Meera Nair", "Rohan Das", "Saanvi Joshi", "Aditya Rao", "Zara Khan",
  "Krishna Pillai", "Riya Banerjee", "Aryan Kulkarni", "Fatima Shaikh", "Dev Malhotra", "Kavya Menon",
  "Yash Patil", "Nisha Agarwal", "Om Tiwari", "Sara Fernandes", "Harsh Chauhan", "Tanvi Desai",
  "Ayaan Qureshi", "Pooja Hegde", "Siddharth Bose", "Neha Saxena", "Rudra Mishra", "Aisha Siddiqui",
  "Laksh Jain", "Prisha Kapoor", "Veer Thakur", "Myra Ghosh", "Ishaan Bhatt", "Anika Rao",
];

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

interface Bot { id: string; name: string; skill: number }
const BOTS: Bot[] = NAMES.map((name, i) => ({ id: `bot-${i}`, name, skill: 0.25 + rng(name)() * 0.7 }));

function botScore(bot: Bot, testId: string): number | null {
  const r = rng(bot.id + testId);
  if (r() < 0.25) return null; // didn't take this test
  const max = TEST_MAP[testId].questionIds.length * MARKS_CORRECT;
  const pct = Math.min(1, Math.max(-0.1, bot.skill + (r() - 0.5) * 0.3));
  return Math.round(pct * max);
}

const submitted = (attempts: Attempt[]) => attempts.filter((a) => a.submittedAt && a.score !== undefined);

function bestByTest(attempts: Attempt[]) {
  const best = new Map<string, number>();
  for (const a of submitted(attempts)) best.set(a.testId, Math.max(best.get(a.testId) ?? -Infinity, a.score!));
  return best;
}

function rank(entries: LeaderboardEntry[]) {
  return entries.sort((a, b) => b.score - a.score || b.testsTaken - a.testsTaken);
}

export function testLeaderboard(testId: string, user: User | null, attempts: Attempt[]): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];
  for (const bot of BOTS) {
    const s = botScore(bot, testId);
    if (s !== null) entries.push({ userId: bot.id, name: bot.name, score: s, testsTaken: 1 });
  }
  const mine = user ? bestByTest(attempts).get(testId) : undefined;
  if (user && mine !== undefined) entries.push({ userId: user.id, name: user.name, score: mine, testsTaken: 1, isYou: true });
  return rank(entries);
}

export function overallLeaderboard(user: User | null, attempts: Attempt[]): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = BOTS.map((bot) => {
    let score = 0, testsTaken = 0;
    for (const t of TESTS) {
      const s = botScore(bot, t.id);
      if (s !== null) { score += s; testsTaken++; }
    }
    return { userId: bot.id, name: bot.name, score, testsTaken };
  });
  if (user) {
    const best = bestByTest(attempts);
    const score = [...best.values()].reduce((a, b) => a + b, 0);
    if (best.size) entries.push({ userId: user.id, name: user.name, score, testsTaken: best.size, isYou: true });
  }
  return rank(entries);
}

export function weeklyLeaderboard(user: User | null, attempts: Attempt[]): LeaderboardEntry[] {
  const week = startOfWeek().toISOString().slice(0, 10);
  const entries: LeaderboardEntry[] = BOTS.map((bot) => {
    const r = rng(bot.id + week);
    const testsTaken = 1 + Math.floor(r() * 3);
    const score = Math.round(testsTaken * 40 * Math.min(1, bot.skill + (r() - 0.5) * 0.3));
    return { userId: bot.id, name: bot.name, score, testsTaken };
  });
  if (user) {
    const since = startOfWeek().getTime();
    const mine = submitted(attempts).filter((a) => new Date(a.submittedAt!).getTime() >= since);
    if (mine.length)
      entries.push({ userId: user.id, name: user.name, score: mine.reduce((s, a) => s + a.score!, 0), testsTaken: mine.length, isYou: true });
  }
  return rank(entries);
}

export function rankOf(entries: LeaderboardEntry[], userId: string) {
  const i = entries.findIndex((e) => e.userId === userId);
  return i < 0 ? null : i + 1;
}

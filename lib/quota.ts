import { FREE_TESTS_PER_WEEK } from "./config";
import type { Attempt, User } from "./types";

// Weeks start Monday 00:00 local time.
export function startOfWeek(d = new Date()) {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
  return s;
}

export function nextWeekReset(d = new Date()) {
  const s = startOfWeek(d);
  s.setDate(s.getDate() + 7);
  return s;
}

export function attemptsThisWeek(attempts: Attempt[]) {
  const since = startOfWeek().getTime();
  return attempts.filter((a) => new Date(a.startedAt).getTime() >= since);
}

export function quotaFor(user: User | null, attempts: Attempt[]) {
  if (!user) return { unlimited: false, used: 0, limit: FREE_TESTS_PER_WEEK, remaining: FREE_TESTS_PER_WEEK };
  if (user.plan === "pro") return { unlimited: true, used: 0, limit: Infinity, remaining: Infinity };
  const used = attemptsThisWeek(attempts).length;
  return { unlimited: false, used, limit: FREE_TESTS_PER_WEEK, remaining: Math.max(0, FREE_TESTS_PER_WEEK - used) };
}

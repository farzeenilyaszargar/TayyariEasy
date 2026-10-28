// Badges are awarded by award_badges() in the database. This file only estimates
// progress toward the count-based ones for display.
import type { Attempt, Badge, EarnedBadge } from "./types";

const COUNT_TARGETS: Record<string, number> = { "first-step": 1, "hat-trick": 3, decathlete: 10 };

export function badgeStatus(badges: Badge[], earned: EarnedBadge[], attempts: Attempt[]) {
  const have = new Map(earned.map((e) => [e.badgeId, e.earnedAt]));
  const done = attempts.filter((a) => a.submittedAt);
  const days = new Set(done.map((a) => a.submittedAt!.slice(0, 10))).size;

  return badges.map((badge) => {
    const earnedAt = have.get(badge.id) ?? null;
    let progress = earnedAt ? 1 : 0;
    if (!earnedAt && COUNT_TARGETS[badge.id]) progress = Math.min(1, done.length / COUNT_TARGETS[badge.id]);
    if (!earnedAt && badge.id === "consistent") progress = Math.min(1, days / 3);
    return { badge, earned: !!earnedAt, earnedAt, progress };
  });
}

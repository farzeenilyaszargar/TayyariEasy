import "server-only";

import { supabaseRest } from "@/lib/supabase-server";

export type BillingStatus = {
  plan: "free" | "pro";
  canStartTest: boolean;
  freeTestsUsed: number;
  freeTestsRemaining: number;
};

export function currentWeekStart() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (kind: string) => Number(parts.find((item) => item.type === kind)?.value);
  const start = new Date(Date.UTC(part("year"), part("month") - 1, part("day")));
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  return start.toISOString().slice(0, 10);
}

export async function getBillingStatus(userId: string): Promise<BillingStatus> {
  const subscriptions = await supabaseRest<Array<{ plan: "free" | "pro"; status: string }>>(
    `user_subscriptions?select=plan,status&user_id=eq.${userId}&limit=1`
  );
  if (subscriptions[0]?.plan === "pro" && subscriptions[0].status === "active") {
    return { plan: "pro", canStartTest: true, freeTestsUsed: 0, freeTestsRemaining: 0 };
  }

  const used = await supabaseRest<Array<{ id: number }>>(
    `test_usage?select=id&user_id=eq.${userId}&week_start=eq.${currentWeekStart()}`
  ).then((rows) => rows.length);

  return { plan: "free", canStartTest: used < 1, freeTestsUsed: used, freeTestsRemaining: Math.max(0, 1 - used) };
}

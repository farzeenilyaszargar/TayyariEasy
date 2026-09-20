import "server-only";

import { supabaseRest } from "@/lib/supabase-server";

export type BillingStatus = {
  plan: "free" | "pro";
  canStartTest: boolean;
  freeTestsUsed: number;
  freeTestsRemaining: number;
};

export async function getBillingStatus(userId: string): Promise<BillingStatus> {
  try {
    const subscriptions = await supabaseRest<Array<{ plan: "free" | "pro"; status: string }>>(
      `user_subscriptions?select=plan,status&user_id=eq.${userId}&limit=1`
    );
    if (subscriptions[0]?.plan === "pro" && subscriptions[0].status === "active") {
      return { plan: "pro", canStartTest: true, freeTestsUsed: 0, freeTestsRemaining: 0 };
    }
  } catch {
    // The app stays usable as free while the billing migration is awaiting installation.
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const used = await supabaseRest<Array<{ id: number }>>(
    `test_attempts?select=id&user_id=eq.${userId}&attempted_at=gte.${weekStart.toISOString().slice(0, 10)}`
  ).then((rows) => rows.length).catch(() => 0);

  return { plan: "free", canStartTest: used < 1, freeTestsUsed: used, freeTestsRemaining: Math.max(0, 1 - used) };
}

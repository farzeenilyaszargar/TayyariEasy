"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { fetchDashboardData, type TestAttemptRow } from "@/lib/supabase-db";
import { getStoredSession } from "@/lib/supabase-auth";

type Billing = { plan: "free" | "pro"; freeTestsUsed: number; freeTestsRemaining: number };

export default function DashboardPage() {
  const { user } = useAuth();
  const [billing, setBilling] = useState<Billing | null>(null);
  const [attempts, setAttempts] = useState<TestAttemptRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user.id) return;
    let active = true;
    const token = getStoredSession()?.accessToken;
    Promise.all([
      fetch("/api/billing/status", { headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: "no-store" }).then(async (response) => {
        if (!response.ok) throw new Error("Your plan status is unavailable right now.");
        return response.json() as Promise<Billing>;
      }),
      fetchDashboardData(user.id)
    ]).then(([plan, data]) => {
      if (!active) return;
      setBilling(plan);
      setAttempts(data.tests);
    }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load progress."); });
    return () => { active = false; };
  }, [user.id]);

  const latest = attempts.at(-1);
  const average = attempts.length ? Math.round(attempts.reduce((total, item) => total + Number(item.score), 0) / attempts.length) : null;
  const accuracy = attempts.length ? Math.round(attempts.reduce((total, item) => total + Number(item.accuracy_percent || 0), 0) / attempts.length) : null;
  const previous = attempts.length > 1 ? attempts.at(-2) : null;
  const scoreChange = latest && previous ? Number(latest.score) - Number(previous.score) : null;
  return <section className="account-dashboard"><header className="account-dashboard-head"><div><span className="demo-kicker">Your preparation</span><h1>Keep moving, {user.name.split(" ")[0]}.</h1><p>Your test history and plan are tied to this account.</p></div><Link href="/tests" className="btn btn-solid">Browse mock tests</Link></header>{error && <p role="status" className="auth-message">{error}</p>}<div className="account-metrics"><article><span>Plan</span><strong>{billing?.plan === "pro" ? "Pro lifetime" : "Free"}</strong><small>{billing?.plan === "pro" ? "Unlimited mock tests" : `${billing?.freeTestsRemaining ?? "—"} of 1 test left this week`}</small></article><article><span>Tests completed</span><strong>{attempts.length}</strong><small>Saved to your account</small></article><article><span>Latest score</span><strong>{latest ? latest.score : "—"}</strong><small>{latest ? latest.test_name : "Your first result will appear here"}</small></article><article><span>Average score</span><strong>{average ?? "—"}</strong><small>Across completed mocks</small></article></div><div className="account-dashboard-lower"><article className="account-panel"><div className="account-panel-heading"><h2>Recent tests</h2><Link href="/tests">Take a test →</Link></div>{attempts.length ? <div className="account-attempts">{attempts.slice(-5).reverse().map((item) => <div key={item.id}><span>{item.test_name}</span><strong>{item.score} pts</strong><small>{item.attempted_at}</small></div>)}</div> : <p>Your results will appear here after your first full mock.</p>}</article><article className="account-panel account-plan-panel"><h2>{billing?.plan === "pro" ? "All access unlocked" : "Your weekly access"}</h2><p>{billing?.plan === "pro" ? "Practice as often as you like and track your progress here." : "One full mock is included each calendar week. Your allowance resets each Monday."}</p>{billing?.plan === "pro" ? <Link href="/tests" className="btn btn-outline">Choose a mock</Link> : <Link href="/pricings" className="btn btn-outline">Explore Pro · ₹199 lifetime</Link>}</article></div>{billing?.plan === "pro" ? <section className="account-advanced"><div><span className="demo-kicker">Pro analysis</span><h2>Look beyond your score.</h2></div><div className="account-advanced-grid"><article><span>Average accuracy</span><strong>{accuracy === null ? "—" : `${accuracy}%`}</strong><small>Correct answers across completed tests</small></article><article><span>Change from previous test</span><strong>{scoreChange === null ? "—" : `${scoreChange > 0 ? "+" : ""}${scoreChange}`}</strong><small>Points gained or lost on your latest attempt</small></article><article><span>Strongest recent test</span><strong>{attempts.length ? Math.max(...attempts.map((item) => Number(item.score))) : "—"}</strong><small>Your best score so far</small></article></div></section> : null}</section>;
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { TestList } from "@/components/TestList";
import { Bar, Loading, LoginPrompt, Notice, PageHead, ProGate, Stat, Stats } from "@/components/ui";
import { fetchLeaderboard, fetchPointsHistory } from "@/lib/api";
import { nextWeekReset, quotaFor } from "@/lib/quota";
import { SUBJECTS } from "@/lib/scoring";

type Ledger = Awaited<ReturnType<typeof fetchPointsHistory>>;
const REASON: Record<string, string> = { test: "Test completed", reattempt: "Test reattempted", badge: "Badge earned" };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function Dashboard() {
  const { user, attempts, ready, tests, testMap, earnedBadges } = useApp();
  const [weekRank, setWeekRank] = useState<number | null>(null);
  const [allRank, setAllRank] = useState<number | null>(null);
  const [ledger, setLedger] = useState<Ledger>([]);

  useEffect(() => {
    if (!user) return;
    fetchLeaderboard("weekly", undefined, 1).then((b) => setWeekRank(b.find((e) => e.isYou)?.rank ?? null)).catch(() => {});
    fetchLeaderboard("overall", undefined, 1).then((b) => setAllRank(b.find((e) => e.isYou)?.rank ?? null)).catch(() => {});
    fetchPointsHistory().then(setLedger).catch(() => {});
  }, [user, attempts.length]);

  if (!ready) return <Loading />;
  if (!user) return <LoginPrompt message="Log in to see your dashboard." />;

  const done = attempts.filter((a) => a.submittedAt).sort((a, b) => b.submittedAt!.localeCompare(a.submittedAt!));
  const inProgress = attempts.filter((a) => !a.submittedAt);
  const quota = quotaFor(user, attempts);
  const taken = new Set(attempts.map((a) => a.testId));
  const upNext = tests.filter((t) => !taken.has(t.id)).slice(0, 4);
  const acc = (c: number | null, w: number | null) => ((c ?? 0) + (w ?? 0) ? (c ?? 0) / ((c ?? 0) + (w ?? 0)) : 0);
  const avgAcc = done.length ? done.reduce((s, a) => s + acc(a.correct, a.wrong), 0) / done.length : 0;

  const mastery = SUBJECTS.map((s) => {
    let correct = 0, total = 0;
    for (const a of done) {
      const b = a.summary?.subjects?.[s];
      if (b) { correct += b.correct; total += b.total; }
    }
    return { s, correct, total };
  });

  return (
    <div className="page stack">
      <PageHead title={`${greeting()}, ${(user.name ?? "").split(" ")[0]}`} sub={user.plan === "pro" ? "Pro plan" : `Free plan · ${quota.remaining} of ${quota.limit} tests left this week`}>
        <Link href="/tests" className="btn">Take a test</Link>
      </PageHead>

      {inProgress.map((a) => (
        <Notice key={a.id} kind="warn">
          You have an unfinished test: <b>{testMap[a.testId]?.title}</b>.{" "}
          <Link href={`/tests/${a.testId}/attempt?a=${a.id}`} className="link">Resume</Link>
        </Notice>
      ))}
      {!quota.unlimited && quota.remaining === 0 && (
        <Notice>Free tests reset on {nextWeekReset().toLocaleDateString("en-IN", { weekday: "long" })}. <Link href="/pricing" className="link">Pro</Link> removes the weekly limit.</Notice>
      )}

      <Stats>
        <Stat label="Tests completed" value={done.length} />
        <Stat label="Average accuracy" value={done.length ? `${Math.round(avgAcc * 100)}%` : "–"} />
        <Stat label="Rank this week" value={weekRank ?? "–"} />
        <Stat label="Rank all time" value={allRank ?? "–"} />
        <Stat label="Points" value={user.points} />
      </Stats>

      <div className="cols-main">
        <div className="stack">
          <section className="stack-sm">
            <div className="spread"><h2>Up next</h2><Link href="/tests" className="link small">All tests</Link></div>
            {upNext.length ? <TestList tests={upNext} /> : <div className="card muted small">You&apos;ve attempted every test. New ones are added every week.</div>}
          </section>

          <section className="stack-sm">
            <div className="spread"><h2>Recent results</h2><Link href="/results" className="link small">All results</Link></div>
            {done.length === 0 ? <div className="card muted small">Your results will appear here after your first test.</div> : (
              <div className="card card-tight table-wrap">
                <table><tbody>
                  {done.slice(0, 5).map((a) => (
                    <tr key={a.id}>
                      <td><Link href={`/results/${a.id}`} style={{ fontWeight: 550 }}>{testMap[a.testId]?.title}</Link></td>
                      <td className="muted">{new Date(a.submittedAt!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                      <td className="r num"><b>{a.score}</b> / {a.maxScore}</td>
                      <td className="r num muted">{Math.round(acc(a.correct, a.wrong) * 100)}%</td>
                    </tr>
                  ))}
                </tbody></table>
              </div>
            )}
          </section>

          <ProGate title="Progress over time">
            <div className="stack">
              <div className="stack-sm">
                <h3>Score trend</h3>
                {done.length === 0 ? <p className="muted small">Take a few tests to see your trend.</p> : (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, borderBottom: "1px solid var(--border)" }}>
                    {[...done].reverse().slice(-20).map((a) => (
                      <div key={a.id} title={`${testMap[a.testId]?.title}: ${a.score}/${a.maxScore}`}
                        style={{ flex: 1, maxWidth: 28, background: "var(--ink)", borderRadius: "3px 3px 0 0", height: `${Math.max(3, (Math.max(0, a.score ?? 0) / (a.maxScore || 1)) * 100)}%` }} />
                    ))}
                  </div>
                )}
              </div>
              <div className="stack-sm">
                <h3>Subject accuracy</h3>
                {mastery.map(({ s, correct, total }) => (
                  <div key={s} className="meter-row">
                    <span>{s}</span>
                    <Bar value={total ? correct / total : 0} />
                    <span className="r">{total ? `${correct}/${total}` : "–"}</span>
                  </div>
                ))}
              </div>
            </div>
          </ProGate>
        </div>

        <aside className="stack">
          <div className="card card-tight">
            <div className="card-head"><h3>Badges</h3><Link href="/badges" className="link xs">View all</Link></div>
            <p className="card-body small">
              {earnedBadges.length ? <>You&apos;ve earned <b>{earnedBadges.length}</b> badge{earnedBadges.length === 1 ? "" : "s"}.</> : "Finish your first test to earn your first badge."}
            </p>
          </div>
          <div className="card card-tight">
            <div className="card-head"><h3>Points history</h3></div>
            {ledger.length === 0 ? <p className="muted small card-body">Points come from finishing tests and earning badges.</p> : (
              <table><tbody>
                {ledger.slice(0, 8).map((l) => (
                  <tr key={l.id}>
                    <td className="small">{REASON[l.reason] ?? l.reason}<div className="muted xs">{new Date(l.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div></td>
                    <td className="r num" style={{ color: "var(--green)" }}>+{l.delta}</td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

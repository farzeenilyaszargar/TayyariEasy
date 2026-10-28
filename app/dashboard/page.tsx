"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Bar, LoginPrompt, ProGate, Stat } from "@/components/ui";
import { fetchLeaderboard, fetchPointsHistory } from "@/lib/api";
import { nextWeekReset, quotaFor } from "@/lib/quota";
import { SUBJECTS } from "@/lib/scoring";

type Ledger = Awaited<ReturnType<typeof fetchPointsHistory>>;
const REASON: Record<string, string> = { test: "Completed a test", reattempt: "Reattempted a test", badge: "Earned a badge" };

export default function Dashboard() {
  const { user, attempts, ready, logout, testMap, earnedBadges } = useApp();
  const [rank, setRank] = useState<number | null>(null);
  const [ledger, setLedger] = useState<Ledger>([]);

  useEffect(() => {
    if (!user) return;
    fetchLeaderboard("overall", undefined, 1).then((b) => setRank(b.find((e) => e.isYou)?.rank ?? null)).catch(() => {});
    fetchPointsHistory().then(setLedger).catch(() => {});
  }, [user, attempts.length]);

  if (!ready) return <div className="container page muted">Loading…</div>;
  if (!user) return <LoginPrompt message="Log in to see your dashboard." />;

  const done = attempts.filter((a) => a.submittedAt).sort((a, b) => b.submittedAt!.localeCompare(a.submittedAt!));
  const inProgress = attempts.filter((a) => !a.submittedAt);
  const quota = quotaFor(user, attempts);
  const acc = (a: (typeof done)[number]) => ((a.correct ?? 0) + (a.wrong ?? 0) ? (a.correct ?? 0) / ((a.correct ?? 0) + (a.wrong ?? 0)) : 0);
  const avgAcc = done.length ? done.reduce((s, a) => s + acc(a), 0) / done.length : 0;

  const subj = SUBJECTS.map((s) => {
    let correct = 0, total = 0;
    for (const a of done) {
      const b = a.summary?.subjects?.[s];
      if (b) { correct += b.correct; total += b.total; }
    }
    return { s, correct, total };
  });

  return (
    <div className="container page stack">
      <div className="page-head">
        <div>
          <h1>Hi, {(user.name ?? "there").split(" ")[0]} 👋</h1>
          <p className="muted">
            {user.plan === "pro" ? <>Pro member{user.proUntil && ` · until ${new Date(user.proUntil).toLocaleDateString()}`}</> : "Free plan"}
            {" · "}{user.phone ? `+${user.phone}` : user.email}
          </p>
        </div>
        <div className="row">
          <Link href="/tests" className="btn">Take a test</Link>
          <button className="btn btn-ghost" onClick={logout}>Log out</button>
        </div>
      </div>

      {!quota.unlimited && (
        <div className="banner banner-info">
          {quota.remaining} of {quota.limit} free tests left this week (resets {nextWeekReset().toLocaleDateString()}).{" "}
          <Link href="/pricing"><b>Go Pro</b></Link> for unlimited tests and deep analysis.
        </div>
      )}

      {inProgress.map((a) => (
        <div key={a.id} className="banner">
          Unfinished: <b>{testMap[a.testId]?.title}</b> · <Link href={`/tests/${a.testId}/attempt?a=${a.id}`}><b>Resume →</b></Link>
        </div>
      ))}

      <div className="grid-4">
        <Stat value={`⚡${user.points}`} label="Tayyari points" />
        <Stat value={done.length} label="Tests completed" />
        <Stat value={rank ? `#${rank}` : "—"} label="All-time rank" />
        <Stat value={`${Math.round(avgAcc * 100)}%`} label="Average accuracy" />
        <Stat value={earnedBadges.length} label="Badges earned" />
      </div>

      <ProGate title="Progress over time">
        <h3>Score trend</h3>
        {done.length === 0 ? <p className="muted">Take a few tests to see your trend.</p> : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
            {[...done].reverse().map((a) => (
              <div key={a.id} title={`${testMap[a.testId]?.title}: ${a.score}/${a.maxScore}`}
                style={{ flex: 1, maxWidth: 40, background: "linear-gradient(180deg, var(--primary-2), var(--primary))", borderRadius: 6, height: `${Math.max(4, (Math.max(0, a.score ?? 0) / (a.maxScore || 1)) * 100)}%` }} />
            ))}
          </div>
        )}
        <h3 style={{ marginTop: 20 }}>Subject mastery</h3>
        {subj.map(({ s, correct, total }) => (
          <div key={s} style={{ marginBottom: 10 }}>
            <div className="spread small"><b>{s}</b><span>{total ? `${correct}/${total} correct` : "no data"}</span></div>
            <Bar value={total ? correct / total : 0} />
          </div>
        ))}
      </ProGate>

      <div className="split">
        <div className="card">
          <h3>Recent tests</h3>
          {done.length === 0 ? <p className="muted">No tests yet. <Link href="/tests"><b>Start your first one →</b></Link></p> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Test</th><th>Date</th><th>Score</th><th>Accuracy</th><th></th></tr></thead>
              <tbody>
                {done.map((a) => (
                  <tr key={a.id}>
                    <td>{testMap[a.testId]?.title}</td>
                    <td>{new Date(a.submittedAt!).toLocaleDateString()}</td>
                    <td><b>{a.score}</b>/{a.maxScore}</td>
                    <td>{Math.round(acc(a) * 100)}%</td>
                    <td><Link href={`/results/${a.id}`} className="btn btn-sm btn-outline">Analysis</Link></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>
        <div className="card">
          <h3>⚡ Points history</h3>
          {ledger.length === 0 ? <p className="muted small">Earn points by finishing tests and unlocking badges.</p> : (
            <table><tbody>
              {ledger.map((l) => (
                <tr key={l.id}>
                  <td className="small">{REASON[l.reason] ?? l.reason}<div className="muted small">{new Date(l.created_at).toLocaleDateString()}</div></td>
                  <td style={{ textAlign: "right" }}><b style={{ color: "var(--green)" }}>+{l.delta}</b></td>
                </tr>
              ))}
            </tbody></table>
          )}
        </div>
      </div>
    </div>
  );
}

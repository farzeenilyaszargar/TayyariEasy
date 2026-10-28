"use client";

import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { Bar, LoginPrompt, ProGate, Stat } from "@/components/ui";
import { TEST_MAP } from "@/data/tests";
import { badgeStatus } from "@/lib/badges";
import { overallLeaderboard, rankOf } from "@/lib/leaderboard";
import { nextWeekReset, quotaFor } from "@/lib/quota";
import { analyze, SUBJECTS } from "@/lib/scoring";

export default function Dashboard() {
  const { user, attempts, ready, logout } = useApp();
  if (!ready) return null;
  if (!user) return <LoginPrompt message="Log in to see your dashboard." />;

  const done = attempts.filter((a) => a.submittedAt).sort((a, b) => b.submittedAt!.localeCompare(a.submittedAt!));
  const inProgress = attempts.filter((a) => !a.submittedAt);
  const quota = quotaFor(user, attempts);
  const rank = rankOf(overallLeaderboard(user, attempts), user.id);
  const badges = badgeStatus(user, attempts);
  const analyses = done.map(analyze);
  const avgAcc = analyses.length ? analyses.reduce((s, a) => s + a.accuracy, 0) / analyses.length : 0;

  // subject mastery across every attempt
  const subj = SUBJECTS.map((s) => {
    let correct = 0, total = 0;
    for (const a of analyses) {
      const b = a.bySubject.find((x) => x.key === s);
      if (b) { correct += b.correct; total += b.total; }
    }
    return { s, correct, total };
  });

  return (
    <div className="container page stack">
      <div className="spread">
        <div>
          <h1>Hi, {user.name.split(" ")[0]} 👋</h1>
          <p className="muted">{user.plan === "pro" ? "Pro member" : "Free plan"} · {user.email || "demo account"}</p>
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
          Unfinished: <b>{TEST_MAP[a.testId].title}</b> · <Link href={`/tests/${a.testId}/attempt?a=${a.id}`}><b>Resume →</b></Link>
        </div>
      ))}

      <div className="grid-4">
        <Stat value={done.length} label="Tests completed" />
        <Stat value={rank ? `#${rank}` : "—"} label="All-time rank" />
        <Stat value={`${Math.round(avgAcc * 100)}%`} label="Average accuracy" />
        <Stat value={`${badges.filter((b) => b.earned).length}/${badges.length}`} label="Badges" />
      </div>

      <ProGate title="Progress over time">
        <h3>Score trend</h3>
        {analyses.length === 0 ? <p className="muted">Take a few tests to see your trend.</p> : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
            {[...analyses].reverse().map((a, i) => (
              <div key={i} title={`${a.score}/${a.maxScore}`} style={{ flex: 1, maxWidth: 40, background: "var(--primary)", borderRadius: 6, height: `${Math.max(4, (Math.max(0, a.score) / a.maxScore) * 100)}%` }} />
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

      <div className="card">
        <h3>Recent tests</h3>
        {done.length === 0 ? <p className="muted">No tests yet. <Link href="/tests"><b>Start your first one →</b></Link></p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Test</th><th>Date</th><th>Score</th><th>Accuracy</th><th></th></tr></thead>
            <tbody>
              {done.map((a, i) => (
                <tr key={a.id}>
                  <td>{TEST_MAP[a.testId].title}</td>
                  <td>{new Date(a.submittedAt!).toLocaleDateString()}</td>
                  <td><b>{a.score}</b>/{a.maxScore}</td>
                  <td>{Math.round(analyses[i].accuracy * 100)}%</td>
                  <td><Link href={`/results/${a.id}`} className="btn btn-sm btn-outline">Analysis</Link></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}

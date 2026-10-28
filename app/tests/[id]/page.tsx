"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Loading, Notice, Stat, Stats, kindLabel } from "@/components/ui";
import { fetchLeaderboard, friendlyError, startAttempt } from "@/lib/api";
import { MARKS_CORRECT, MARKS_WRONG } from "@/lib/config";
import { quotaFor } from "@/lib/quota";
import { SUBJECTS } from "@/lib/scoring";
import type { LeaderboardEntry } from "@/lib/types";

export default function TestDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, attempts, ready, testMap, questionMap, refresh } = useApp();
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchLeaderboard("test", id, 10).then(setBoard).catch(() => {}); }, [id, user?.id]);

  const test = testMap[id];
  if (!ready) return <Loading />;
  if (!test) return <div className="page"><h1>Test not found</h1></div>;

  const inProgress = attempts.find((a) => a.testId === id && !a.submittedAt);
  const past = attempts.filter((a) => a.testId === id && a.submittedAt);
  const quota = quotaFor(user, attempts);
  const sections = SUBJECTS.map((s) => [s, test.questionIds.filter((q) => questionMap[q]?.subject === s).length] as const).filter(([, n]) => n);
  const blocked = !!user && !inProgress && quota.remaining <= 0;

  async function start() {
    if (!user) return router.push(`/login?next=/tests/${id}`);
    setBusy(true); setError("");
    try {
      const attempt = await startAttempt(id);
      await refresh();
      router.push(`/tests/${id}/attempt?a=${attempt.id}`);
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  }

  return (
    <div className="page stack">
      <Link href="/tests" className="row muted small"><ArrowLeft size={15} />All tests</Link>
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <div className="row" style={{ marginBottom: 8 }}>
            <span className="tag">{kindLabel[test.kind]}</span>
            {test.subject && <span className="tag">{test.subject}</span>}
          </div>
          <h1>{test.title}</h1>
          <p>{test.description}</p>
        </div>
      </div>

      <div className="cols-main">
        <div className="stack">
          <Stats>
            <Stat label="Questions" value={test.questionIds.length} />
            <Stat label="Duration" value={<>{test.durationMin}<small> min</small></>} />
            <Stat label="Maximum marks" value={test.questionIds.length * MARKS_CORRECT} />
          </Stats>

          <div className="card stack-sm">
            <h2>Before you start</h2>
            <ul className="small" style={{ color: "var(--text-2)" }}>
              <li>+{MARKS_CORRECT} for a correct answer, {MARKS_WRONG} for a wrong answer, 0 if left blank.</li>
              <li>Numerical questions take a typed numeric answer.</li>
              <li>Questions marked for review are still evaluated if answered.</li>
              <li>The test submits automatically when time runs out. Progress is saved if you refresh.</li>
              <li>Sections: {sections.map(([s, n]) => `${s} (${n})`).join(", ")}.</li>
            </ul>
          </div>

          {blocked && <Notice kind="warn">You&apos;ve used this week&apos;s free tests. They reset on Monday, or <Link href="/pricing" className="link">upgrade to Pro</Link> for unlimited tests.</Notice>}
          {error && <Notice kind="error">{error}</Notice>}

          <div className="row">
            <button className="btn btn-lg" onClick={start} disabled={busy || blocked}>
              {busy ? "Starting…" : !user ? "Log in to start" : inProgress ? "Resume test" : past.length ? "Reattempt" : "Start test"}
            </button>
            {!inProgress && user && !quota.unlimited && !blocked && (
              <span className="muted small">Uses 1 of {quota.remaining} free tests left this week</span>
            )}
          </div>

          {past.length > 0 && (
            <div className="card card-tight">
              <div className="card-head"><h3>Your attempts</h3></div>
              <table><tbody>
                {past.map((a) => (
                  <tr key={a.id}>
                    <td className="muted">{new Date(a.submittedAt!).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="num"><b>{a.score}</b> / {a.maxScore}</td>
                    <td className="r"><Link className="link" href={`/results/${a.id}`}>Analysis</Link></td>
                  </tr>
                ))}
              </tbody></table>
            </div>
          )}
        </div>

        <div className="card card-tight">
          <div className="card-head">
            <h3>Top scores</h3>
            <Link href={`/leaderboard?test=${id}`} className="link xs">View all</Link>
          </div>
          {board.length === 0 ? <p className="muted small card-body">No scores yet.</p> : (
            <table><tbody>
              {board.map((e) => (
                <tr key={e.userId} className={e.isYou ? "you" : ""}>
                  <td className="rank">{e.rank}</td>
                  <td>{e.name}{e.isYou && <span className="muted"> (you)</span>}</td>
                  <td className="r num">{e.score}</td>
                </tr>
              ))}
            </tbody></table>
          )}
        </div>
      </div>
    </div>
  );
}

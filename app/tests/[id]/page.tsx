"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { kindLabel } from "@/components/ui";
import { QUESTION_MAP } from "@/data/questions";
import { TEST_MAP } from "@/data/tests";
import { MARKS_CORRECT, MARKS_WRONG } from "@/lib/config";
import { testLeaderboard } from "@/lib/leaderboard";
import { quotaFor } from "@/lib/quota";
import { SUBJECTS } from "@/lib/scoring";
import { store, uid } from "@/lib/store";

export default function TestDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, attempts, ready } = useApp();
  const test = TEST_MAP[id];
  if (!test) return <div className="container page"><h2>Test not found</h2></div>;

  const inProgress = attempts.find((a) => a.testId === id && !a.submittedAt);
  const past = attempts.filter((a) => a.testId === id && a.submittedAt).sort((a, b) => b.submittedAt!.localeCompare(a.submittedAt!));
  const quota = quotaFor(user, attempts);
  const board = testLeaderboard(id, user, attempts).slice(0, 10);
  const counts = SUBJECTS.map((s) => [s, test.questionIds.filter((q) => QUESTION_MAP[q].subject === s).length] as const).filter(([, n]) => n);

  function start() {
    if (!user) return router.push("/login");
    if (inProgress) return router.push(`/tests/${id}/attempt?a=${inProgress.id}`);
    const attempt = { id: uid(), userId: user.id, testId: id, startedAt: new Date().toISOString(), answers: {} };
    store.saveAttempt(attempt);
    router.push(`/tests/${id}/attempt?a=${attempt.id}`);
  }

  const blocked = !!user && !inProgress && quota.remaining <= 0;

  return (
    <div className="container page">
      <div className="grid" style={{ gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", alignItems: "start" }}>
        <div className="card stack">
          <div className="row"><span className="chip chip-gray">{kindLabel[test.kind]}</span>{test.subject && <span className="chip chip-gray">{test.subject}</span>}</div>
          <h1>{test.title}</h1>
          <p className="muted">{test.description}</p>
          <div className="grid-4">
            <div className="stat"><div className="v">{test.questionIds.length}</div><div className="l">Questions</div></div>
            <div className="stat"><div className="v">{test.durationMin}m</div><div className="l">Duration</div></div>
            <div className="stat"><div className="v">{test.questionIds.length * MARKS_CORRECT}</div><div className="l">Max marks</div></div>
          </div>
          <div>
            <h3>Instructions</h3>
            <ul className="muted">
              <li>+{MARKS_CORRECT} for a correct answer, {MARKS_WRONG} for a wrong answer, 0 if unattempted.</li>
              <li>Numerical questions need a numeric answer typed in the box.</li>
              <li>Use &quot;Mark for review&quot; to come back to a question. Marked questions with an answer are evaluated.</li>
              <li>The test auto-submits when the timer runs out. Progress is saved if you refresh.</li>
              <li>Sections: {counts.map(([s, n]) => `${s} (${n})`).join(", ")}</li>
            </ul>
          </div>
          {blocked && (
            <div className="banner">You&apos;ve used your free tests for this week. They reset on Monday — or <Link href="/pricing"><b>go Pro</b></Link> for unlimited tests.</div>
          )}
          <div className="row">
            <button className="btn" onClick={start} disabled={!ready || blocked}>
              {!user ? "Log in to start" : inProgress ? "Resume test" : past.length ? "Reattempt test" : "Start test"}
            </button>
            {!inProgress && user && !quota.unlimited && !blocked && <span className="muted small">Uses 1 of your {quota.remaining} free tests this week</span>}
          </div>
          {past.length > 0 && (
            <div>
              <h3>Your attempts</h3>
              <table><tbody>
                {past.map((a) => (
                  <tr key={a.id}>
                    <td>{new Date(a.submittedAt!).toLocaleString()}</td>
                    <td><b>{a.score}</b> / {a.maxScore}</td>
                    <td><Link className="btn btn-sm btn-outline" href={`/results/${a.id}`}>View analysis</Link></td>
                  </tr>
                ))}
              </tbody></table>
            </div>
          )}
        </div>
        <div className="card">
          <h3>Top scorers</h3>
          <table><tbody>
            {board.map((e, i) => (
              <tr key={e.userId} className={e.isYou ? "you" : ""}><td>#{i + 1}</td><td>{e.name}{e.isYou && " (you)"}</td><td><b>{e.score}</b></td></tr>
            ))}
          </tbody></table>
          <Link href={`/leaderboard?test=${id}`} className="small muted">Full leaderboard →</Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { Loading, LoginPrompt, PageHead } from "@/components/ui";

export default function ResultsIndex() {
  const { user, ready, attempts, testMap } = useApp();
  if (!ready) return <Loading />;
  if (!user) return <LoginPrompt message="Log in to see your results." />;

  const done = attempts.filter((a) => a.submittedAt).sort((a, b) => b.submittedAt!.localeCompare(a.submittedAt!));
  const acc = (c: number | null, w: number | null) => ((c ?? 0) + (w ?? 0) ? Math.round(((c ?? 0) / ((c ?? 0) + (w ?? 0))) * 100) : 0);

  return (
    <div className="page stack">
      <PageHead title="Results" sub="Every test you've submitted, with analysis and solutions." />
      {done.length === 0 ? (
        <div className="card empty">
          <h3>No results yet</h3>
          <p className="small" style={{ marginBottom: 16 }}>Finish a test to see your score, rank and solutions here.</p>
          <Link href="/tests" className="btn">Browse tests</Link>
        </div>
      ) : (
        <div className="card card-tight table-wrap">
          <table>
            <thead><tr><th>Test</th><th>Date</th><th className="r">Score</th><th className="r">Accuracy</th><th className="r">Correct · Wrong · Skipped</th><th></th></tr></thead>
            <tbody>
              {done.map((a) => (
                <tr key={a.id}>
                  <td><Link href={`/results/${a.id}`} style={{ fontWeight: 550 }}>{testMap[a.testId]?.title ?? a.testId}</Link></td>
                  <td className="muted">{new Date(a.submittedAt!).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="r num"><b>{a.score}</b> / {a.maxScore}</td>
                  <td className="r num">{acc(a.correct, a.wrong)}%</td>
                  <td className="r num muted">{a.correct} · {a.wrong} · {a.skipped}</td>
                  <td className="r"><Link href={`/results/${a.id}`} className="link small">Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

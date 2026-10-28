"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { TESTS, TEST_MAP } from "@/data/tests";
import { overallLeaderboard, rankOf, testLeaderboard, weeklyLeaderboard } from "@/lib/leaderboard";

type Mode = "weekly" | "overall" | "test";
const MEDALS = ["🥇", "🥈", "🥉"];

function Board() {
  const params = useSearchParams();
  const { user, attempts } = useApp();
  const [mode, setMode] = useState<Mode>(params.get("test") ? "test" : "weekly");
  const [testId, setTestId] = useState(params.get("test") ?? TESTS[0].id);

  const entries =
    mode === "weekly" ? weeklyLeaderboard(user, attempts)
    : mode === "overall" ? overallLeaderboard(user, attempts)
    : testLeaderboard(testId, user, attempts);
  const myRank = user ? rankOf(entries, user.id) : null;

  return (
    <div className="container page stack">
      <div className="spread">
        <div>
          <h1>Leaderboard</h1>
          <p className="muted">Give tests, climb the ranks. Weekly boards reset every Monday.</p>
        </div>
        {myRank && <div className="stat"><div className="v">#{myRank}</div><div className="l">Your rank</div></div>}
      </div>

      <div className="spread">
        <div className="tabs">
          <button className={`tab ${mode === "weekly" ? "active" : ""}`} onClick={() => setMode("weekly")}>This week</button>
          <button className={`tab ${mode === "overall" ? "active" : ""}`} onClick={() => setMode("overall")}>All time</button>
          <button className={`tab ${mode === "test" ? "active" : ""}`} onClick={() => setMode("test")}>By test</button>
        </div>
        {mode === "test" && (
          <select className="select" value={testId} onChange={(e) => setTestId(e.target.value)}>
            {TESTS.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        )}
      </div>

      {user && !myRank && <div className="banner banner-info">You&apos;re not on this board yet — finish a test to get ranked.</div>}

      <div className="card table-wrap">
        <table>
          <thead><tr><th>Rank</th><th>Student</th><th>{mode === "test" ? "Best score" : "Total score"}</th><th>Tests</th></tr></thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.userId} className={e.isYou ? "you" : ""}>
                <td>{MEDALS[i] ?? `#${i + 1}`}</td>
                <td>{e.name}{e.isYou && " (you)"}</td>
                <td><b>{e.score}</b>{mode === "test" && <span className="muted small"> / {TEST_MAP[testId].questionIds.length * 4}</span>}</td>
                <td>{e.testsTaken}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted small">Other students on this board are sample data until accounts go live.</p>
    </div>
  );
}

export default function LeaderboardPage() {
  return <Suspense><Board /></Suspense>;
}

"use client";

import { Trophy } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { PageHead } from "@/components/ui";
import { fetchLeaderboard } from "@/lib/api";
import type { LeaderboardEntry, LeaderboardKind } from "@/lib/types";

const MODES: { key: LeaderboardKind; label: string; metric: string }[] = [
  { key: "weekly", label: "This week", metric: "Score" },
  { key: "overall", label: "All time", metric: "Total score" },
  { key: "test", label: "By test", metric: "Best score" },
  { key: "points", label: "Points", metric: "Points" },
];

function Board() {
  const params = useSearchParams();
  const { user, tests, testMap } = useApp();
  const [mode, setMode] = useState<LeaderboardKind>(params.get("test") ? "test" : "weekly");
  const [testId, setTestId] = useState(params.get("test") ?? "");
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const tid = testId || tests[0]?.id;

  useEffect(() => {
    if (mode === "test" && !tid) return;
    setEntries(null);
    fetchLeaderboard(mode, mode === "test" ? tid : undefined, 100).then(setEntries).catch(() => setEntries([]));
  }, [mode, tid, user?.id]);

  const me = entries?.find((e) => e.isYou);
  const metric = MODES.find((m) => m.key === mode)!.metric;

  return (
    <div className="page stack">
      <PageHead title="Leaderboard" sub="Rankings update as soon as a test is submitted. The weekly board resets every Monday.">
        {me && <span className="tag tag-accent num" style={{ height: 28, fontSize: ".85rem" }}>Your rank: {me.rank}</span>}
      </PageHead>

      <div className="spread">
        <div className="seg">
          {MODES.map((m) => <button key={m.key} className={mode === m.key ? "active" : ""} onClick={() => setMode(m.key)}>{m.label}</button>)}
        </div>
        {mode === "test" && (
          <select className="select" value={tid} onChange={(e) => setTestId(e.target.value)} aria-label="Test">
            {tests.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        )}
      </div>

      <div className="card card-tight">
        {entries === null ? <p className="muted small card-body">Loading…</p> : entries.length === 0 ? (
          <div className="empty">
            <Trophy size={28} strokeWidth={1.5} />
            <h3>No rankings yet</h3>
            <p className="small" style={{ marginBottom: 16 }}>Submit a test to appear on this board.</p>
            <Link href="/tests" className="btn btn-secondary">Browse tests</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Rank</th><th>Student</th><th className="r">{metric}</th><th className="r">Tests</th></tr></thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.userId} className={e.isYou ? "you" : ""}>
                    <td className="rank" style={e.rank <= 3 ? { color: "var(--text)", fontWeight: 600 } : undefined}>{e.rank}</td>
                    <td>{e.name}{e.isYou && <span className="muted"> (you)</span>}</td>
                    <td className="r num"><b>{e.score}</b>{mode === "test" && tid && testMap[tid] && <span className="muted"> / {testMap[tid].questionIds.length * 4}</span>}</td>
                    <td className="r num muted">{e.testsTaken}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return <Suspense><Board /></Suspense>;
}

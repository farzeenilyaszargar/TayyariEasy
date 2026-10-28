"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { fetchLeaderboard } from "@/lib/api";
import type { LeaderboardEntry, LeaderboardKind } from "@/lib/types";

const MODES: { key: LeaderboardKind; label: string; metric: string }[] = [
  { key: "weekly", label: "This week", metric: "Score this week" },
  { key: "overall", label: "All time", metric: "Total best scores" },
  { key: "points", label: "⚡ Points", metric: "Tayyari points" },
  { key: "test", label: "By test", metric: "Best score" },
];
const MEDALS = ["🥇", "🥈", "🥉"];

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
  const top3 = entries?.filter((e) => e.rank <= 3).slice(0, 3) ?? [];
  const metric = MODES.find((m) => m.key === mode)!.metric;

  return (
    <div className="container page stack">
      <div className="page-head">
        <div>
          <h1>Leaderboard</h1>
          <p className="muted">Give tests, climb the ranks. The weekly board resets every Monday.</p>
        </div>
        {me && <div className="stat"><div className="v">#{me.rank}</div><div className="l">Your rank · {me.score}</div></div>}
      </div>

      <div className="spread">
        <div className="tabs">
          {MODES.map((m) => (
            <button key={m.key} className={`tab ${mode === m.key ? "active" : ""}`} onClick={() => setMode(m.key)}>{m.label}</button>
          ))}
        </div>
        {mode === "test" && (
          <select className="select" value={tid} onChange={(e) => setTestId(e.target.value)}>
            {tests.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        )}
      </div>

      {entries === null ? <p className="muted">Loading…</p> : entries.length === 0 ? (
        <div className="card center">
          <div style={{ fontSize: "2.4rem" }}>🏁</div>
          <h3>No one here yet</h3>
          <p className="muted">Finish a test and you&apos;ll be first on this board.</p>
          <Link href="/tests" className="btn">Take a test</Link>
        </div>
      ) : (
        <>
          {top3.length === 3 && (
            <div className="podium">
              {[top3[1], top3[0], top3[2]].map((e) => (
                <div key={e.userId} className={`p ${e.rank === 1 ? "first" : ""}`}>
                  <div className="medal">{MEDALS[e.rank - 1]}</div>
                  <div className="name">{e.name}{e.isYou && " (you)"}</div>
                  <div className="score">{e.score}</div>
                </div>
              ))}
            </div>
          )}
          {user && !me && <div className="banner banner-info">You&apos;re not on this board yet — finish a test to get ranked.</div>}
          <div className="card table-wrap">
            <table>
              <thead><tr><th>Rank</th><th>Student</th><th>{metric}</th><th>Tests</th></tr></thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.userId} className={e.isYou ? "you" : ""}>
                    <td className="rank-cell">{MEDALS[e.rank - 1] ?? `#${e.rank}`}</td>
                    <td>{e.name}{e.isYou && " (you)"}</td>
                    <td><b>{e.score}</b>{mode === "test" && tid && testMap[tid] && <span className="muted small"> / {testMap[tid].questionIds.length * 4}</span>}</td>
                    <td>{e.testsTaken}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  return <Suspense><Board /></Suspense>;
}

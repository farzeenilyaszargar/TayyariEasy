"use client";

import { Crown, Trophy } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Avatar } from "@/components/Avatar";
import { fetchLeaderboard } from "@/lib/api";
import type { LeaderboardEntry, LeaderboardKind } from "@/lib/types";

// Weekly and all-time rank by points; a single paper ranks by marks.
const MODES: { key: LeaderboardKind; label: string; unit: string }[] = [
  { key: "weekly", label: "This week", unit: "pts" },
  { key: "overall", label: "All time", unit: "pts" },
  { key: "test", label: "By paper", unit: "marks" },
];
const PODIUM = [
  { place: 2, color: "#9aa5b1", h: 96 },
  { place: 1, color: "var(--yellow)", h: 128 },
  { place: 3, color: "#cd7f32", h: 76 },
];

function Board() {
  const params = useSearchParams();
  const { user, tests } = useApp();
  const papers = tests.filter((t) => t.kind !== "demo");
  const [mode, setMode] = useState<LeaderboardKind>(params.get("test") ? "test" : "weekly");
  const [testId, setTestId] = useState(params.get("test") ?? "");
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const tid = testId || papers[0]?.id;

  useEffect(() => {
    if (mode === "test" && !tid) return;
    setEntries(null);
    fetchLeaderboard(mode, mode === "test" ? tid : undefined, 100).then(setEntries).catch(() => setEntries([]));
  }, [mode, tid, user?.id]);

  const me = entries?.find((e) => e.isYou);
  const unit = MODES.find((m) => m.key === mode)!.unit;
  const top = entries?.slice(0, 3) ?? [];

  return (
    <div className="page page-narrow stack">
      <div className="center stack-sm">
        <div style={{ width: 84, height: 84, margin: "0 auto", borderRadius: 24, background: "var(--yellow)", boxShadow: "0 5px 0 var(--yellow-dark)", display: "grid", placeItems: "center", color: "#fff" }}>
          <Trophy size={44} />
        </div>
        <h1>Leaderboard</h1>
        <p className="muted">
          {me ? `You're #${me.rank}${mode === "weekly" ? " this week" : mode === "overall" ? " overall" : " on this paper"}. Keep climbing!` : "Finish a paper to get on the board."}
        </p>
        {mode !== "test" && <p className="faint small">Ranked by points from papers and badges{mode === "weekly" ? ", reset every Monday" : ""}.</p>}
      </div>

      <div className="chips" style={{ justifyContent: "center" }}>
        {MODES.map((m) => <button key={m.key} className={`chip-btn ${mode === m.key ? "active" : ""}`} onClick={() => setMode(m.key)}>{m.label}</button>)}
      </div>
      {mode === "test" && (
        <div className="center">
          <select className="select" value={tid} onChange={(e) => setTestId(e.target.value)} aria-label="Paper">
            {papers.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
      )}

      {entries === null ? <p className="muted center">Loading…</p> : entries.length === 0 ? (
        <div className="card empty stack-sm">
          <h3>Nobody here yet</h3>
          <p>Be the first name on this board.</p>
          <Link href="/papers" className="btn">Find a paper</Link>
        </div>
      ) : (
        <>
          {top.length === 3 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, alignItems: "end" }}>
              {PODIUM.map(({ place, color, h }) => {
                const e = top[place - 1];
                return (
                  <div key={place} className="center">
                    {place === 1 && <Crown size={26} color="var(--yellow)" fill="var(--yellow)" />}
                    <div style={{ display: "grid", placeItems: "center", margin: "4px 0 8px" }}>
                      <Avatar name={e.name} url={e.avatarUrl} color={e.avatarColor} size={place === 1 ? 64 : 52} />
                    </div>
                    <div style={{ fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.isYou ? "You" : e.name}</div>
                    <div className="muted small">{e.score} {unit}</div>
                    <div style={{ height: h, marginTop: 8, borderRadius: "14px 14px 0 0", background: color, color: "#fff", display: "grid", placeItems: "center", fontSize: "2rem", fontWeight: 900 }}>{place}</div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="card" style={{ padding: 8 }}>
            {entries.slice(top.length === 3 ? 3 : 0).map((e) => (
              <div key={e.userId} className={`lb-row ${e.isYou ? "you" : ""}`}>
                <span className={`rank rank-${e.rank}`}>{e.rank}</span>
                <Avatar name={e.name} url={e.avatarUrl} color={e.avatarColor} size={40} />
                <span className="name">{e.isYou ? "You" : e.name}</span>
                <span className="score">{e.score} {unit}</span>
              </div>
            ))}
            {top.length === 3 && entries.length === 3 && <p className="muted small center" style={{ padding: 12 }}>That&apos;s everyone so far.</p>}
          </div>
        </>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  return <Suspense><Board /></Suspense>;
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Avatar } from "@/components/Avatar";
import { Medallion } from "@/components/Icon";
import { fetchLeaderboard } from "@/lib/api";
import type { LeaderboardEntry, LeaderboardKind } from "@/lib/types";

// Both boards rank by points from papers and badges.
const MODES: { key: LeaderboardKind; label: string }[] = [
  { key: "weekly", label: "This week" },
  { key: "overall", label: "All time" },
];
const PODIUM = [
  { place: 2, medal: "silver", h: 84 },
  { place: 1, medal: "gold", h: 112 },
  { place: 3, medal: "bronze", h: 64 },
] as const;

export default function LeaderboardPage() {
  const { user } = useApp();
  const [mode, setMode] = useState<LeaderboardKind>("weekly");
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    setEntries(null);
    fetchLeaderboard(mode, undefined, 100).then(setEntries).catch(() => setEntries([]));
  }, [mode, user?.id]);

  const me = entries?.find((e) => e.isYou);
  const unit = "pts";
  const top = entries?.slice(0, 3) ?? [];

  return (
    <div className="page page-narrow stack">
      <div className="center stack-sm">
        <div style={{ display: "grid", placeItems: "center" }}><Medallion name="trophy" size={64} tint="var(--tint-amber)" /></div>
        <h1>Leaderboard</h1>
        <p className="muted">
          {me ? `You're #${me.rank}${mode === "weekly" ? " this week" : " overall"}. Keep climbing!` : "Finish a paper to get on the board."}
        </p>
        <p className="faint small">Ranked by points from papers and badges{mode === "weekly" ? ", reset every Monday" : ""}.</p>
      </div>

      <div className="chips" style={{ justifyContent: "center" }}>
        {MODES.map((m) => <button key={m.key} className={`chip-btn ${mode === m.key ? "active" : ""}`} onClick={() => setMode(m.key)}>{m.label}</button>)}
      </div>

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
              {PODIUM.map(({ place, medal, h }) => {
                const e = top[place - 1];
                return (
                  <div key={place} className="center">
                    <div style={{ display: "grid", placeItems: "center", margin: "4px 0 8px" }}>
                      <Avatar name={e.name} url={e.avatarUrl} color={e.avatarColor} size={place === 1 ? 64 : 52} />
                    </div>
                    <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.isYou ? "You" : e.name}</div>
                    <div className="muted small">{e.score} {unit}</div>
                    <div style={{ height: h, marginTop: 10, borderRadius: "14px 14px 0 0", background: "#fff", border: "1px solid var(--line)", borderBottom: 0, boxShadow: "var(--shadow-sm)", display: "grid", placeItems: "center" }}>
                      <span className={`podium-num podium-${medal}`}>{place}</span>
                    </div>
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

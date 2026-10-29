"use client";

import { Crown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Avatar } from "@/components/Avatar";
import { IconTile } from "@/components/Icon";
import { Mark } from "@/components/Mark";
import { Loading, Segmented } from "@/components/ui";
import { fetchLeaderboard } from "@/lib/api";
import type { LeaderboardEntry, LeaderboardKind } from "@/lib/types";

// Both boards rank by points from papers and badges.
const MODES: { key: LeaderboardKind; label: string }[] = [
  { key: "weekly", label: "This week" },
  { key: "overall", label: "All time" },
];
const PODIUM = [
  { place: 2, h: 92 },
  { place: 1, h: 128 },
  { place: 3, h: 70 },
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
  const above = me && entries ? entries[entries.indexOf(me) - 1] : undefined;
  const top = entries?.slice(0, 3) ?? [];
  const best = Math.max(1, entries?.[0]?.score ?? 1);
  const rest = entries?.slice(top.length === 3 ? 3 : 0) ?? [];

  return (
    <div className="page page-narrow stack">
      <div className="lb-hero">
        <Mark size={300} grain className="lb-mark" color="var(--cream)" />
        <div className="spread" style={{ position: "relative", alignItems: "flex-start" }}>
          <div>
            <h1>The <em>leaderboard</em></h1>
            <p className="sub small" style={{ marginTop: 6 }}>Ranked by points from papers and badges{mode === "weekly" ? ", reset every Monday" : ""}.</p>
          </div>
          <Segmented value={mode} onChange={setMode} options={MODES} />
        </div>

        {entries === null ? <div style={{ padding: "40px 0" }}><Loading full={false} /></div> : top.length === 3 ? (
          <div className="podium">
            {PODIUM.map(({ place, h }) => {
              const e = top[place - 1];
              return (
                <div key={place} className="podium-col">
                  <div className="av">
                    {place === 1 && <Crown size={22} className="crown" strokeWidth={1.8} />}
                    <Avatar name={e.name} url={e.avatarUrl} color={e.avatarColor} size={place === 1 ? 68 : 54} />
                  </div>
                  <div className="who">{e.isYou ? "You" : e.name}</div>
                  <div className="pts">{e.score} pts</div>
                  <div className={`podium-block podium-${place}`} style={{ height: h }}><span className="n">{place}</span></div>
                </div>
              );
            })}
          </div>
        ) : <div style={{ height: 28 }} />}
      </div>

      {entries && (me ? (
        <div className="card lb-you">
          <span className="big">#{me.rank}</span>
          <div style={{ flex: 1 }}>
            <h3>{mode === "weekly" ? "Your rank this week" : "Your all-time rank"}</h3>
            <p className="muted small">{above ? `${above.score - me.score + 1} pts to pass ${above.isYou ? "the next player" : above.name}` : "You're at the top. Defend it."}</p>
          </div>
          <Link href="/papers" className="btn btn-sm btn-pill">Earn points</Link>
        </div>
      ) : (
        <div className="card lb-you">
          <IconTile name="trophy" size={44} />
          <div style={{ flex: 1 }}><h3>You&apos;re not on this board yet</h3><p className="muted small">Finish a paper to earn points and get ranked.</p></div>
          <Link href="/papers" className="btn btn-sm btn-pill">Find a paper</Link>
        </div>
      ))}

      {entries && entries.length > 0 && rest.length > 0 && (
        <div className="card lb-list" style={{ padding: 8 }}>
          {rest.map((e, i) => (
            <div key={e.userId} className={`lb-row ${e.isYou ? "you" : ""}`} style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
              <span className="rank">{e.rank}</span>
              <Avatar name={e.name} url={e.avatarUrl} color={e.avatarColor} size={38} />
              <span className="name">{e.isYou ? "You" : e.name}</span>
              <span className="bar-mini"><i style={{ width: `${(e.score / best) * 100}%` }} /></span>
              <span className="score">{e.score} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

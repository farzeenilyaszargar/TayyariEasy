"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Bar } from "@/components/ui";
import { fetchBadges } from "@/lib/api";
import { badgeStatus } from "@/lib/badges";
import type { Badge } from "@/lib/types";

export default function BadgesPage() {
  const { user, attempts, earnedBadges } = useApp();
  const [badges, setBadges] = useState<Badge[]>([]);
  useEffect(() => { fetchBadges().then(setBadges).catch(() => {}); }, []);

  const status = badgeStatus(badges, user ? earnedBadges : [], user ? attempts : []);
  const earned = status.filter((s) => s.earned).length;

  return (
    <div className="container page stack">
      <div className="page-head">
        <div>
          <h1>Badges</h1>
          <p className="muted">Collect badges as you practise. Each one adds ⚡ points to your profile.</p>
        </div>
        <div className="row">
          <div className="stat"><div className="v">{earned}/{badges.length || "–"}</div><div className="l">Earned</div></div>
          {user && <div className="stat"><div className="v">⚡{user.points}</div><div className="l">Points</div></div>}
        </div>
      </div>
      <div className="grid">
        {status.map(({ badge, progress, earned, earnedAt }) => (
          <div key={badge.id} className={`card badge-card ${earned ? "" : "locked-badge"}`}>
            <div className="badge-medal">{badge.emoji}</div>
            <h3 style={{ margin: 0 }}>{badge.name}</h3>
            <p className="muted small" style={{ margin: 0 }}>{badge.description}</p>
            <span className="chip chip-accent">+{badge.points} ⚡</span>
            {earned
              ? <span className="chip chip-green">Earned {new Date(earnedAt!).toLocaleDateString()}</span>
              : <Bar value={progress} />}
          </div>
        ))}
      </div>
    </div>
  );
}

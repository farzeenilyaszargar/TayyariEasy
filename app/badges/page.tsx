"use client";

import { useApp } from "@/components/AppProvider";
import { Bar } from "@/components/ui";
import { BADGES, badgeStatus } from "@/lib/badges";

export default function BadgesPage() {
  const { user, attempts } = useApp();
  const status = user ? badgeStatus(user, attempts) : BADGES.map((badge) => ({ badge, progress: 0, earned: false }));
  const earned = status.filter((s) => s.earned).length;

  return (
    <div className="container page stack">
      <div className="spread">
        <div>
          <h1>Badges</h1>
          <p className="muted">Collect badges as you practise. Some are easy, some are legendary.</p>
        </div>
        <div className="stat"><div className="v">{earned}/{BADGES.length}</div><div className="l">Earned</div></div>
      </div>
      <div className="grid">
        {status.map(({ badge, progress, earned }) => (
          <div key={badge.id} className={`card badge-card ${earned ? "" : "locked-badge"}`}>
            <div className="emoji">{badge.emoji}</div>
            <h3>{badge.name}</h3>
            <p className="muted small">{badge.description}</p>
            {earned ? <span className="chip chip-green">Earned</span> : <Bar value={progress} />}
          </div>
        ))}
      </div>
    </div>
  );
}

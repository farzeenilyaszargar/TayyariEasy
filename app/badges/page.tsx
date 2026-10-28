"use client";

import {
  Atom, Calculator, CalendarCheck, Crosshair, Flag, FlaskConical, Footprints, Layers, Medal, Moon, ShieldCheck, Trophy, type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Bar, PageHead, Stat, Stats } from "@/components/ui";
import { fetchBadges } from "@/lib/api";
import { badgeStatus } from "@/lib/badges";
import type { Badge } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  "first-step": Footprints, "hat-trick": Layers, decathlete: Medal, "full-mock": Flag,
  "physics-ace": Atom, "chem-ace": FlaskConical, "maths-ace": Calculator, sharpshooter: Crosshair,
  "no-guesswork": ShieldCheck, consistent: CalendarCheck, "top-10": Trophy, "night-owl": Moon,
};

export default function BadgesPage() {
  const { user, attempts, earnedBadges } = useApp();
  const [badges, setBadges] = useState<Badge[]>([]);
  useEffect(() => { fetchBadges().then(setBadges).catch(() => {}); }, []);

  const status = badgeStatus(badges, user ? earnedBadges : [], user ? attempts : []);
  const earned = status.filter((s) => s.earned).length;

  return (
    <div className="page stack">
      <PageHead title="Badges" sub="Milestones for consistency, accuracy and subject mastery. Each badge adds points to your profile." />

      {user && (
        <Stats>
          <Stat label="Badges earned" value={<>{earned}<small> / {badges.length}</small></>} />
          <Stat label="Points" value={user.points} />
        </Stats>
      )}

      <div className="grid">
        {status.map(({ badge, progress, earned, earnedAt }) => {
          const Icon = ICONS[badge.id] ?? Medal;
          return (
            <div key={badge.id} className={`card badge-tile ${earned ? "" : "locked-badge"}`}>
              <div className="badge-icon"><Icon size={20} strokeWidth={1.8} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="spread"><h3>{badge.name}</h3><span className="muted xs num">+{badge.points} pts</span></div>
                <p className="muted small" style={{ marginTop: 2 }}>{badge.description}</p>
                {earned
                  ? <p className="xs" style={{ marginTop: 8, color: "var(--green)" }}>Earned {new Date(earnedAt!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                  : progress > 0 && <Bar value={progress} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

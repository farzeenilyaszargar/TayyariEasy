"use client";

import {
  Atom, Calculator, CalendarCheck, Crosshair, Flag, FlaskConical, Footprints, Layers, Medal, Moon, ShieldCheck, Trophy, type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { fetchBadges } from "@/lib/api";
import { badgeStatus } from "@/lib/badges";
import type { Badge } from "@/lib/types";
import { useApp } from "./AppProvider";
import { Bar } from "./ui";

const LOOK: Record<string, [LucideIcon, string]> = {
  "first-step": [Footprints, "var(--green)"], "hat-trick": [Layers, "var(--blue)"], decathlete: [Medal, "var(--purple)"],
  "full-mock": [Flag, "var(--red)"], "physics-ace": [Atom, "var(--blue)"], "chem-ace": [FlaskConical, "var(--green)"],
  "maths-ace": [Calculator, "var(--orange)"], sharpshooter: [Crosshair, "var(--red)"], "no-guesswork": [ShieldCheck, "#00cd9c"],
  consistent: [CalendarCheck, "var(--orange)"], "top-10": [Trophy, "var(--yellow)"], "night-owl": [Moon, "#2b70c9"],
};

export function useBadges() {
  const [badges, setBadges] = useState<Badge[]>([]);
  useEffect(() => { fetchBadges().then(setBadges).catch(() => {}); }, []);
  return badges;
}

export function BadgeGrid({ limit }: { limit?: number }) {
  const { attempts, earnedBadges } = useApp();
  const badges = useBadges();
  const status = badgeStatus(badges, earnedBadges, attempts).sort((a, b) => Number(b.earned) - Number(a.earned));
  return (
    <div className="badge-grid">
      {status.slice(0, limit).map(({ badge, earned, progress }) => {
        const [Icon, color] = LOOK[badge.id] ?? [Medal, "var(--blue)"];
        return (
          <div key={badge.id} className={`card badge ${earned ? "" : "locked-badge"}`} title={badge.description}>
            <div className="badge-medal" style={{ background: color }}><Icon size={30} /></div>
            <h3>{badge.name}</h3>
            <p>{badge.description}</p>
            {!earned && progress > 0 && <div style={{ marginTop: 8 }}><Bar value={progress} /></div>}
            {earned && <p style={{ color: "var(--green-dark)", fontWeight: 800 }}>+{badge.points} pts</p>}
          </div>
        );
      })}
    </div>
  );
}

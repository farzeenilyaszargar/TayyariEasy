"use client";

import { useEffect, useState } from "react";
import { fetchBadges } from "@/lib/api";
import { badgeStatus } from "@/lib/badges";
import type { Badge } from "@/lib/types";
import { useApp } from "./AppProvider";
import { IconTile, type IconName } from "./Icon";
import { Bar } from "./ui";

const LOOK: Record<string, [IconName, string]> = {
  "first-step": ["footprints", "var(--tint-green)"], "hat-trick": ["star", "var(--tint-amber)"], decathlete: ["medal", "var(--tint-violet)"],
  "full-mock": ["flag", "var(--tint-slate)"], "physics-ace": ["atom", "var(--tint-blue)"], "chem-ace": ["flask", "var(--tint-green)"],
  "maths-ace": ["abacus", "var(--tint-amber)"], sharpshooter: ["target", "var(--tint-rose)"], "no-guesswork": ["shield", "var(--tint-indigo)"],
  consistent: ["calendar", "var(--tint-amber)"], "top-10": ["trophy", "var(--tint-amber)"], "night-owl": ["moon", "var(--tint-indigo)"],
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
        const [icon, tint] = LOOK[badge.id] ?? (["medal", "var(--tint-slate)"] as [IconName, string]);
        return (
          <div key={badge.id} className={`card badge ${earned ? "" : "locked-badge"}`} title={badge.description}>
            <IconTile name={icon} tint={tint} size={60} />
            <h3>{badge.name}</h3>
            <p>{badge.description}</p>
            {!earned && progress > 0 && <div style={{ marginTop: 8 }}><Bar value={progress} /></div>}
            {earned && <p style={{ color: "var(--green-dark)", fontWeight: 700 }}>+{badge.points} pts</p>}
          </div>
        );
      })}
    </div>
  );
}

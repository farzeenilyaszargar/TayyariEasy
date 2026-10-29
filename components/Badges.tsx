"use client";

import { useEffect, useState } from "react";
import { fetchBadges } from "@/lib/api";
import { badgeStatus } from "@/lib/badges";
import type { Badge } from "@/lib/types";
import { useApp } from "./AppProvider";
import { Glyph, type IconName } from "./Icon";

const ICON: Record<string, IconName> = {
  "first-step": "footprints", "hat-trick": "star", decathlete: "medal", "full-mock": "flag", "physics-ace": "atom",
  "chem-ace": "flask", "maths-ace": "abacus", sharpshooter: "target", "no-guesswork": "shield", consistent: "calendar",
  "top-10": "trophy", "night-owl": "moon",
};

// Scalloped seal outline (16 lobes), precomputed once so server and client agree.
const SEAL_PATH = (() => {
  const n = 32, pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? 44 : 49;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(1)} ${(50 + Math.sin(a) * r).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
})();

export function Seal({ icon, earned, progress = 0, size = 84 }: { icon: IconName; earned: boolean; progress?: number; size?: number }) {
  const c = 2 * Math.PI * 38;
  return (
    <span className="seal" style={{ width: size, height: size }}>
      <svg className="shape" viewBox="0 0 100 100" aria-hidden>
        {earned ? (
          <>
            <path d={SEAL_PATH} fill="var(--ink)" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="var(--cream)" strokeOpacity=".35" strokeWidth="1" strokeDasharray="2 3" />
          </>
        ) : (
          <>
            <path d={SEAL_PATH} fill="var(--cream-2)" stroke="var(--line-strong)" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="var(--cream-3)" strokeWidth="4" />
            {progress > 0 && (
              <circle cx="50" cy="50" r="38" fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={c} strokeDashoffset={c * (1 - progress)} transform="rotate(-90 50 50)" />
            )}
          </>
        )}
      </svg>
      {earned && <span className="shine" />}
      <span className="glyph"><Glyph name={icon} size={Math.round(size * 0.36)} color={earned ? "var(--cream)" : "var(--ink-3)"} strokeWidth={1.6} /></span>
    </span>
  );
}

export function useBadges() {
  const [badges, setBadges] = useState<Badge[]>([]);
  useEffect(() => { fetchBadges().then(setBadges).catch(() => {}); }, []);
  return badges;
}

// Shows earned and in-progress badges first; the rest only after "Show all".
export function BadgeGrid({ limit }: { limit?: number }) {
  const { attempts, earnedBadges } = useApp();
  const badges = useBadges();
  const [all, setAll] = useState(false);
  const status = badgeStatus(badges, earnedBadges, attempts)
    .sort((a, b) => Number(b.earned) - Number(a.earned) || b.progress - a.progress);
  const active = status.filter((s) => s.earned || s.progress > 0);
  // With nothing started yet, still show the first few to aim for.
  const base = active.length ? active : status.slice(0, 3);
  const shown = (all ? status : base).slice(0, all ? undefined : limit);
  const hidden = status.length - shown.length;

  return (
    <>
      <div className="seal-grid">
        {shown.map(({ badge, earned, progress }) => (
          <div key={badge.id} className={`seal-card ${earned ? "seal-earned" : progress > 0 ? "" : "seal-locked"}`} title={badge.description}>
            <Seal icon={ICON[badge.id] ?? "medal"} earned={earned} progress={progress} />
            <h3>{badge.name}</h3>
            <p>{badge.description}</p>
            <span className="seal-foot">
              {earned ? <span className="tag tag-green">+{badge.points} pts</span>
                : progress > 0 ? <span className="muted">{Math.round(progress * 100)}% there</span>
                : <span className="faint">Locked · {badge.points} pts</span>}
            </span>
          </div>
        ))}
      </div>
      {(hidden > 0 || all) && status.length > base.length && (
        <div className="show-more">
          <button className="btn btn-white btn-sm btn-pill" onClick={() => setAll(!all)}>
            {all ? "Show less" : `Show all ${status.length} badges`}
          </button>
        </div>
      )}
    </>
  );
}

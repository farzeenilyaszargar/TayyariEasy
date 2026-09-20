"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PREVIEW = [
  { rank: "01", name: "Aarav M.", points: "1,860" },
  { rank: "02", name: "Ananya S.", points: "1,745" },
  { rank: "03", name: "Vihaan K.", points: "1,680" },
  { rank: "04", name: "Ishita R.", points: "1,540" }
];

export function LockedLeaderboard() {
  const pathname = usePathname();
  const next = pathname === "/leaderboards" ? "/tests" : pathname;
  return <section className="locked-leaderboard"><div className="locked-preview" aria-hidden="true"><div className="locked-preview-head"><span>Weekly leaderboard</span><strong>Top aspirants</strong></div>{PREVIEW.map((row) => <div className="locked-preview-row" key={row.rank}><span>#{row.rank}</span><strong>{row.name}</strong><span>{row.points} pts</span></div>)}</div><div className="locked-panel"><span className="demo-kicker">Your next chapter starts here</span><h1>See where you can go.</h1><p>Your demo is complete. Create a free account to unlock JEE mock tests, the leaderboards and your progress dashboard.</p><Link href={`/auth?next=${encodeURIComponent(next)}`} className="btn btn-solid">Sign in to unlock JEE mock tests</Link><small>One free full mock every week · no payment required</small></div></section>;
}

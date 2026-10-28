"use client";

import { Award } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { BadgeGrid } from "@/components/Badges";
import { PaperIcon } from "@/components/PaperCard";
import { Bar, PageHead, ProGate, ProMini, StatTile } from "@/components/ui";
import { fetchLeaderboard } from "@/lib/api";
import { streakDays } from "@/lib/quota";
import { SUBJECTS } from "@/lib/scoring";

const SUBJECT_COLOR: Record<string, string> = { Physics: "var(--blue)", Chemistry: "var(--green)", Mathematics: "var(--orange)" };

export default function Analytics() {
  const { user, attempts, testMap } = useApp();
  const [weekRank, setWeekRank] = useState<number | null>(null);
  useEffect(() => { fetchLeaderboard("weekly", undefined, 1).then((b) => setWeekRank(b.find((e) => e.isYou)?.rank ?? null)).catch(() => {}); }, [attempts.length]);
  if (!user) return null;

  const done = attempts.filter((a) => a.submittedAt && testMap[a.testId]?.kind !== "demo").sort((a, b) => b.submittedAt!.localeCompare(a.submittedAt!));
  const acc = (c: number | null, w: number | null) => ((c ?? 0) + (w ?? 0) ? (c ?? 0) / ((c ?? 0) + (w ?? 0)) : 0);
  const avgAcc = done.length ? done.reduce((s, a) => s + acc(a.correct, a.wrong), 0) / done.length : 0;
  const best = done.length ? Math.max(...done.map((a) => Math.round(((a.score ?? 0) / (a.maxScore || 1)) * 100))) : 0;

  const mastery = SUBJECTS.map((s) => {
    let correct = 0, total = 0;
    for (const a of done) {
      const b = a.summary?.subjects?.[s];
      if (b) { correct += b.correct; total += b.total; }
    }
    return { s, correct, total };
  });

  return (
    <div className="page stack">
      <PageHead title="Dashboard" sub="How your preparation is going." />

      <div className="stat-tiles">
        <StatTile icon="paper" tint="var(--tint-indigo)" value={done.length} label="Papers done" />
        <StatTile icon="check" tint="var(--tint-green)" value={done.length ? `${Math.round(avgAcc * 100)}%` : "–"} label="Avg accuracy" />
        <StatTile icon="target" tint="var(--tint-rose)" value={done.length ? `${best}%` : "–"} label="Best score" />
        <StatTile icon="trophy" tint="var(--tint-amber)" value={weekRank ? `#${weekRank}` : "–"} label="Rank this week" />
        <StatTile icon="fire" tint="var(--tint-amber)" value={streakDays(attempts)} label="Day streak" />
      </div>

      <div className="cols-main">
        <div className="stack">
          <div className="card stack-sm">
            <h2>Subject accuracy</h2>
            {mastery.map(({ s, correct, total }) => (
              <div key={s} className="meter-row">
                <span style={{ fontWeight: 800 }}>{s}</span>
                <Bar value={total ? correct / total : 0} color={SUBJECT_COLOR[s]} />
                <span className="r">{total ? `${Math.round((correct / total) * 100)}%` : "–"}</span>
              </div>
            ))}
          </div>

          <div className="card card-tight">
            <div className="card-head"><h2>Recent papers</h2></div>
            {done.length === 0 ? (
              <div className="empty stack-sm"><p>No papers yet.</p><Link href="/papers" className="btn btn-sm">Find a paper</Link></div>
            ) : (
              <div style={{ padding: "8px 8px 12px" }}>
                {done.slice(0, 8).map((a) => {
                  const t = testMap[a.testId];
                  return (
                    <Link key={a.id} href={`/results/${a.id}`} className="lb-row" style={{ gap: 14 }}>
                      {t && <PaperIcon test={t} size={40} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="name">{t?.title}</div>
                        <div className="muted xs">{new Date(a.submittedAt!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {Math.round(acc(a.correct, a.wrong) * 100)}% accuracy</div>
                      </div>
                      <span className="tag tag-green num">{a.score}/{a.maxScore}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <ProGate title="Score trend and predicted percentile">
            <h2>Score trend</h2>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140, marginTop: 14 }}>
              {(done.length
                ? [...done].reverse().slice(-16).map((a) => Math.max(0, (a.score ?? 0) / (a.maxScore || 1)))
                : [0.3, 0.45, 0.4, 0.6, 0.55, 0.7, 0.65, 0.8] // placeholder shape behind the Pro lock
              ).map((pct, i) => (
                <div key={i} style={{ flex: 1, maxWidth: 32, height: `${Math.max(6, pct * 100)}%`, background: "var(--blue)", borderRadius: "8px 8px 0 0" }} />
              ))}
            </div>
          </ProGate>
        </div>

        <aside className="stack">
          <ProMini text="See chapter-wise weak spots, time per question and predicted rank." />
          <div className="card stack-sm">
            <div className="spread"><h2>Badges</h2><Link href="/profile" className="link small">All</Link></div>
            <BadgeGrid limit={4} />
            {done.length === 0 && <p className="muted small"><Award size={14} style={{ verticalAlign: -2 }} /> Finish papers to unlock badges.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}

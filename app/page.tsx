"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { kindLabel } from "@/components/ui";
import { fetchLeaderboard } from "@/lib/api";
import { FREE_TESTS_PER_WEEK } from "@/lib/config";
import type { LeaderboardEntry } from "@/lib/types";

const FEATURES = [
  { icon: "📝", title: "Feels like the real exam", text: "NTA-style interface: question palette, mark for review, section tabs, +4/−1 marking and auto-submit." },
  { icon: "🎯", title: "Practise the way you study", text: "Full-length mocks, subject sectionals and quick chapter sprints when you only have 10 minutes." },
  { icon: "🏆", title: "Compete every week", text: "Weekly and all-time leaderboards plus a board for every paper. Watch your name climb." },
  { icon: "🎖️", title: "Badges that keep you going", text: "Streaks, sharpshooter accuracy, subject mastery — collect them all." },
  { icon: "📊", title: "Know where marks leak", text: "Pro analysis: chapter strengths, time per question, silly mistakes, percentile and rank prediction." },
  { icon: "🆓", title: "Free. Actually free.", text: `${FREE_TESTS_PER_WEEK} tests every week with score, rank, accuracy and full solutions. No card needed.` },
];

export default function Home() {
  const { user, tests } = useApp();
  const weekly = tests.slice(0, 3);
  const [top, setTop] = useState<LeaderboardEntry[]>([]);
  useEffect(() => { fetchLeaderboard("points", undefined, 5).then(setTop).catch(() => {}); }, []);

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="chip chip-accent">🔥 New free tests every Monday</span>
            <h1>Your JEE <span className="grad">tayyari</span>,<br />measured every week.</h1>
            <p className="lead">Take free JEE Main mock tests in the real exam interface, see exactly where you rank, and earn badges as you build the habit.</p>
            <div className="row">
              <Link href={user ? "/tests" : "/login"} className="btn btn-lg">{user ? "Take this week's test" : "Start practising free"} →</Link>
              <Link href="/leaderboard" className="btn btn-ghost btn-lg">See leaderboard</Link>
            </div>
            <div className="hero-proof">
              <div><b>{tests.length || "7"}+</b><span>tests live</span></div>
              <div><b>+4 / −1</b><span>JEE Main marking</span></div>
              <div><b>12</b><span>badges to earn</span></div>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <div className="mock-preview">
              <div className="spread">
                <b className="small">JEE Main Full Mock #1</b>
                <span className="timer small">⏱ 72:14</span>
              </div>
              <div className="tabs" style={{ marginTop: 12 }}>
                <span className="tab active">Physics</span><span className="tab">Chemistry</span><span className="tab">Maths</span>
              </div>
              <p style={{ margin: "14px 0 6px", fontWeight: 600 }}>Q4. A spring of constant 200 N/m is compressed by 0.1 m. The stored energy is:</p>
              <div className="opt"><span className="k">A</span>0.5 J</div>
              <div className="opt sel"><span className="k">B</span>1 J</div>
              <div className="opt"><span className="k">C</span>2 J</div>
              <div className="opt"><span className="k">D</span>10 J</div>
            </div>
            <div className="floating" style={{ top: -14, left: -10 }}>🏅 Sharpshooter unlocked</div>
            <div className="floating" style={{ bottom: -16, right: 6 }}>📈 Rank #12 → #4</div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="spread" style={{ alignItems: "flex-end", marginBottom: 24 }}>
            <div className="section-head" style={{ margin: 0 }}>
              <div className="eyebrow">This week</div>
              <h2>Fresh tests, ready for you</h2>
            </div>
            <Link href="/tests" className="btn btn-ghost btn-sm">All tests →</Link>
          </div>
          <div className="grid">
            {weekly.map((t) => (
              <Link key={t.id} href={`/tests/${t.id}`} className="card test-card">
                <div className={`stripe ${t.kind === "full" ? "subj-full" : `subj-${t.subject}`}`} />
                <div className="row"><span className="chip chip-gray">{kindLabel[t.kind]}</span>{t.subject && <span className="chip chip-gray">{t.subject}</span>}</div>
                <h3>{t.title}</h3>
                <p className="muted small" style={{ margin: 0 }}>{t.description}</p>
                <div className="meta"><span>📄 {t.questionIds.length} Qs</span><span>⏱ {t.durationMin} min</span><span>🎯 {t.questionIds.length * 4}</span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "var(--card)", borderBlock: "1px solid var(--border)" }}>
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">Why Tayyari</div>
            <h2>Everything you need to turn practice into rank</h2>
          </div>
          <div className="grid">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p className="muted">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div>
            <div className="section-head">
              <div className="eyebrow">How it works</div>
              <h2>A weekly rhythm that sticks</h2>
            </div>
            <div className="grid steps" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))" }}>
              <div className="step"><h3>Take the weekly tests</h3><p className="muted small">Two free papers drop every Monday — full mocks, sectionals or chapter sprints.</p></div>
              <div className="step"><h3>Review every answer</h3><p className="muted small">Instant score, rank and step-by-step solutions for every question.</p></div>
              <div className="step"><h3>Climb &amp; collect</h3><p className="muted small">Move up the leaderboard and unlock badges as your consistency grows.</p></div>
            </div>
          </div>
          <div className="card">
            <div className="spread"><h3>🏆 Top students</h3><Link href="/leaderboard" className="small muted">View all →</Link></div>
            {top.length === 0 ? (
              <p className="muted small">No one on the board yet — your first test puts you here.</p>
            ) : (
              <table><tbody>
                {top.map((e) => (
                  <tr key={e.userId}><td className="rank-cell">{["🥇", "🥈", "🥉"][e.rank - 1] ?? `#${e.rank}`}</td><td>{e.name}</td><td style={{ textAlign: "right" }}><b>⚡{e.score}</b></td></tr>
                ))}
              </tbody></table>
            )}
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 72 }}>
        <div className="cta-band spread">
          <div>
            <h2 style={{ fontSize: "1.8rem" }}>Ready to see where you stand?</h2>
            <p style={{ margin: 0 }}>Your first test takes 2 minutes to start. No payment, no catch.</p>
          </div>
          <Link href={user ? "/tests" : "/login"} className="btn btn-lg">Start your first test →</Link>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <span>© {new Date().getFullYear()} Tayyari · tayyari.online</span>
          <span className="row"><Link href="/tests">Tests</Link><Link href="/leaderboard">Leaderboard</Link><Link href="/pricing">Pricing</Link></span>
        </div>
      </footer>
    </>
  );
}

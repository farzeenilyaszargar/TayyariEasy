"use client";

import { ArrowRight, Check, Clock, Flame } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/AppShell";
import { Glyph, IconTile, type IconName } from "@/components/Icon";
import { ScoreRing } from "@/components/ScoreRing";

const SUBJECTS = [
  { name: "Physics", score: 72, color: "var(--sub-physics)" },
  { name: "Chemistry", score: 81, color: "var(--sub-chem)" },
  { name: "Mathematics", score: 59, color: "var(--sub-maths)" },
];

// A composition of real product surfaces instead of illustrations.
function HeroArt() {
  return (
    <div className="hero-bento" aria-hidden>
      {/* result card */}
      <div className="card" style={{ padding: 22, boxShadow: "var(--shadow-lg)" }}>
        <div className="spread" style={{ marginBottom: 18 }}>
          <div>
            <div className="upper faint">Result</div>
            <div style={{ fontWeight: 700, marginTop: 2 }}>JEE Main Full Mock #4</div>
          </div>
          <span className="tag tag-green">Top 8%</span>
        </div>
        <div className="row" style={{ gap: 22, flexWrap: "nowrap" }}>
          <ScoreRing value={212} max={300} size={104} stroke={9} />
          <div style={{ flex: 1 }}>
            {SUBJECTS.map((s) => (
              <div key={s.name} style={{ marginBottom: 10 }}>
                <div className="spread xs" style={{ fontWeight: 600 }}><span>{s.name}</span><span className="muted num">{s.score}/100</span></div>
                <div className="bar" style={{ height: 6, marginTop: 5 }}><div style={{ width: `${s.score}%`, background: s.color }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hero-bento-row">
      {/* rank card */}
      <div className="card" style={{ padding: 8, boxShadow: "var(--shadow-lg)" }}>
        <div className="spread" style={{ padding: "6px 10px 8px" }}>
          <span className="upper faint">This week</span>
          <span className="row xs" style={{ gap: 4, color: "#ea580c", fontWeight: 650 }}><Flame size={13} fill="#fdba74" />7-day streak</span>
        </div>
        {[["1", "Ananya I.", 412, "#7c5cff"], ["2", "You", 356, "#4f46e5"], ["3", "Rohan D.", 298, "#12a37a"]].map(([r, n, s, c]) => (
          <div key={r as string} className={`lb-row ${n === "You" ? "you" : ""}`} style={{ padding: "6px 10px", gap: 10 }}>
            <span className={`rank rank-${r}`} style={{ width: 14 }}>{r}</span>
            <span className="avatar" style={{ width: 24, height: 24, background: c as string, fontSize: 11 }}>{(n as string)[0]}</span>
            <span className="name small">{n}</span><span className="score small">{s} pts</span>
          </div>
        ))}
      </div>

      {/* question card */}
      <div className="card" style={{ padding: 14, boxShadow: "var(--shadow-lg)" }}>
        <div className="spread xs" style={{ marginBottom: 10 }}>
          <span className="row" style={{ gap: 6, fontWeight: 650 }}><Glyph name="atom" size={14} color="var(--sub-physics)" />Physics · Q4</span>
          <span className="row muted num" style={{ gap: 4 }}><Clock size={12} />12:40</span>
        </div>
        {["0.5 J", "1 J", "2 J"].map((o, i) => (
          <div key={o} className={`option static ${i === 1 ? "selected" : ""}`} style={{ marginBottom: 6, padding: "7px 10px", fontSize: ".82rem", gap: 10 }}>
            <span className="key" style={{ width: 22, height: 22, fontSize: ".7rem" }}>{String.fromCharCode(65 + i)}</span>{o}
          </div>
        ))}
      </div>

      </div>
    </div>
  );
}

const STEPS = [
  { n: "01", title: "Take a paper", text: "Two free papers every week, from full mocks to 10-minute chapter sprints." },
  { n: "02", title: "See exactly what happened", text: "Score, rank and accuracy the moment you submit, with a solution for every question." },
  { n: "03", title: "Come back stronger", text: "Points, streaks and a weekly leaderboard turn practice into a habit." },
];

const FEATURES: { title: string; text: string; icon: IconName; tint: string }[] = [
  { title: "The real exam interface", text: "Question palette, mark for review, +4 / −1 marking and an auto-submitting timer, exactly like test day.", icon: "stopwatch", tint: "var(--tint-indigo)" },
  { title: "Rank against everyone", text: "Weekly and all-time leaderboards show where you stand among students preparing with you.", icon: "trophy", tint: "var(--tint-amber)" },
  { title: "Points, streaks and badges", text: "Every paper earns points. Streaks and badges reward the consistency that actually moves your rank.", icon: "medal", tint: "var(--tint-violet)" },
  { title: "Analysis that finds weak spots", text: "Subject and chapter accuracy, time per question and predicted percentile with Pro.", icon: "chart", tint: "var(--tint-green)" },
];

export default function Landing() {
  return (
    <div className="land">
      <header className="land-nav">
        <Logo />
        <div className="row" style={{ gap: 8 }}>
          <Link href="/login" className="btn btn-ghost btn-sm" style={{ color: "var(--text)" }}>Log in</Link>
          <Link href="/login" className="btn btn-sm">Get started</Link>
        </div>
      </header>

      <section className="land-hero">
        <div>
          <span className="eyebrow"><span className="dot" />New papers every Monday</span>
          <h1>Mock tests that show you <em>exactly where you stand.</em></h1>
          <p className="lead">JEE Main papers in the real exam format, instant analysis after every attempt, and a leaderboard that keeps you consistent until exam day.</p>
          <div className="row" style={{ gap: 12 }}>
            <Link href="/login" className="btn btn-lg">Start practising free <ArrowRight size={18} /></Link>
            <Link href="/login" className="btn btn-white btn-lg">Log in</Link>
          </div>
          <div className="row muted small" style={{ gap: 20, marginTop: 24 }}>
            {["2 free papers a week", "Full solutions", "No card needed"].map((t) => (
              <span key={t} className="row" style={{ gap: 6 }}><Check size={15} strokeWidth={2.4} color="var(--green)" />{t}</span>
            ))}
          </div>
        </div>
        <HeroArt />
      </section>

      <section className="land-steps">
        <div className="land-band-inner steps-grid">
          {STEPS.map((s) => (
            <div key={s.n}>
              <div className="step-n">{s.n}</div>
              <h3 style={{ marginTop: 10 }}>{s.title}</h3>
              <p className="muted small" style={{ marginTop: 6 }}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="land-band">
        <div className="land-band-inner">
          <div style={{ maxWidth: 560, marginBottom: 36 }}>
            <div className="upper" style={{ color: "var(--indigo)" }}>Why Tayyari</div>
            <h2 style={{ fontSize: "2rem", marginTop: 10 }}>Everything between now and exam day.</h2>
            <p className="muted" style={{ marginTop: 10 }}>Built around the habits that actually move ranks: regular papers, honest feedback and a reason to come back.</p>
          </div>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="card feature-card">
                <IconTile name={f.icon} tint={f.tint} size={44} />
                <h3>{f.title}</h3>
                <p className="small">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="land-cta">
        <h2>Your next rank starts with one paper.</h2>
        <p>Sign up in under a minute with your phone, email or Google.</p>
        <Link href="/login" className="btn btn-white btn-lg">Get started <ArrowRight size={18} /></Link>
      </section>

      <footer className="land-foot">© {new Date().getFullYear()} Tayyari · tayyari.online</footer>
    </div>
  );
}

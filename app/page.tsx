"use client";

import { ArrowRight, ArrowUpRight, Clock } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/AppShell";
import { ChartLoop, ExamLoop, RankLoop, StreakLoop } from "@/components/LoopArt";
import { Mark } from "@/components/Mark";
import { ScoreRing } from "@/components/ScoreRing";

const SUBJECTS = [
  { name: "Physics", score: 72 },
  { name: "Chemistry", score: 81 },
  { name: "Mathematics", score: 59 },
];

// A composition of real product surfaces instead of illustrations.
function HeroArt() {
  return (
    <div className="hero-stage" aria-hidden>
      <Mark size={520} spin grain className="hero-mark" />
      <div className="hero-bento">
        <div className="card hero-card">
          <div className="spread" style={{ marginBottom: 18 }}>
            <div>
              <div className="upper faint">Result</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>JEE Main Full Mock #4</div>
            </div>
            <span className="tag tag-green">Top 8%</span>
          </div>
          <div className="row" style={{ gap: 22, flexWrap: "nowrap" }}>
            <ScoreRing value={212} max={300} size={104} stroke={8} />
            <div style={{ flex: 1 }}>
              {SUBJECTS.map((s) => (
                <div key={s.name} style={{ marginBottom: 10 }}>
                  <div className="spread xs" style={{ fontWeight: 550 }}><span>{s.name}</span><span className="muted num">{s.score}/100</span></div>
                  <div className="bar" style={{ marginTop: 5 }}><div style={{ width: `${s.score}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hero-bento-row">
          <div className="card hero-card" style={{ padding: 8 }}>
            <div className="spread" style={{ padding: "6px 10px 8px" }}>
              <span className="upper faint">This week</span>
              <span className="xs muted">7-day streak</span>
            </div>
            {[["1", "Ananya I.", 412], ["2", "You", 356], ["3", "Rohan D."]].map(([r, n, s]) => (
              <div key={r as string} className={`lb-row ${n === "You" ? "you" : ""}`} style={{ padding: "6px 10px", gap: 10 }}>
                <span className="rank" style={{ width: 14 }}>{r}</span>
                <span className="avatar" style={{ width: 24, height: 24, fontSize: 11, background: n === "You" ? "var(--cream)" : "var(--ink-3)", color: n === "You" ? "var(--ink)" : "var(--cream)" }}>{(n as string)[0]}</span>
                <span className="name small">{n}</span><span className="score small">{s ?? 298} pts</span>
              </div>
            ))}
          </div>

          <div className="card hero-card" style={{ padding: 14 }}>
            <div className="spread xs" style={{ marginBottom: 10 }}>
              <span style={{ fontWeight: 600 }}>Physics · Q4</span>
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
    </div>
  );
}

const FACTS = [
  ["+4 / −1", "Real exam marking"],
  ["180 min", "Full-length mocks"],
  ["Mondays", "New papers every week"],
  ["2 free", "Papers, every week"],
];

const STEPS = [
  { n: "i.", title: "Take a paper", text: "Two free papers every week, from full mocks to ten-minute chapter sprints." },
  { n: "ii.", title: "See exactly what happened", text: "Score, rank and accuracy the moment you submit, with a worked solution for every question." },
  { n: "iii.", title: "Come back stronger", text: "Points, streaks and a weekly leaderboard turn practice into a habit you keep." },
];

const FEATURES = [
  { title: "The real exam interface", text: "Question palette, mark for review, +4 / −1 marking and an auto-submitting timer, exactly like test day.", Art: ExamLoop },
  { title: "Rank against everyone", text: "Weekly and all-time leaderboards show where you stand among students preparing alongside you.", Art: RankLoop },
  { title: "Streaks that build habits", text: "Every paper earns points. Streaks and badges reward the consistency that actually moves ranks.", Art: StreakLoop },
  { title: "Analysis that finds weak spots", text: "Subject and chapter accuracy, time per question and a predicted percentile with Pro.", Art: ChartLoop },
];

// Sample testimonials for the launch layout. Replace with real student quotes before going live.
const REVIEWS = [
  { name: "Aditi R.", meta: "Class 12 · Jaipur", text: "I used to finish a mock and only look at the score. The breakdown showed me I lose most marks in the last forty minutes, not on the hard questions." },
  { name: "Karthik S.", meta: "Dropper · Hyderabad", text: "The interface is close enough to the real one that the exam hall felt familiar. Marking for review stopped being something I had to think about." },
  { name: "Mehak B.", meta: "Class 12 · Ludhiana", text: "Two papers a week sounds small, but it is exactly the pace I can keep alongside coaching. The streak keeps me honest." },
  { name: "Arjun P.", meta: "Class 11 · Pune", text: "Watching my name move up the weekly board is a strange amount of motivation. I take the Sunday paper even when I am tired now." },
  { name: "Sana K.", meta: "Class 12 · Lucknow", text: "Chapter sprints are perfect after a lecture. Ten minutes, and I know straight away whether I actually understood it." },
  { name: "Dev M.", meta: "Dropper · Kolkata", text: "Negative marking used to scare me into skipping. Practising with +4 / −1 every week taught me when a guess is worth taking." },
];

export default function Landing() {
  return (
    <div className="land">
      <header className="land-nav">
        <Logo />
        <Link href="/login" className="btn btn-sm btn-pill">Get started <ArrowRight size={15} /></Link>
      </header>

      <section className="land-hero">
        <div>
          <div className="lexicon">
            <span className="serif">tayyari</span>
            <span className="faint">/ tai·yaa·ree /</span>
            <span className="faint">noun</span>
            <span>preparation, readiness.</span>
          </div>
          <h1>Practice papers for the <em>serious</em> JEE aspirant.</h1>
          <p className="lead">JEE Main papers in the real exam format, honest analysis after every attempt, and a leaderboard that keeps you consistent until exam day.</p>
          <div className="row" style={{ gap: 18 }}>
            <Link href="/login" className="btn btn-lg">Start practising free <ArrowRight size={18} /></Link>
            <span className="muted small">No card needed</span>
          </div>
        </div>
        <HeroArt />
      </section>

      <section className="land-facts">
        {FACTS.map(([v, l]) => (
          <div key={l}><div className="fact-v">{v}</div><div className="fact-l">{l}</div></div>
        ))}
      </section>

      <section className="land-section">
        <div className="land-inner">
          <div className="section-head">
            <div className="upper faint">How it works</div>
            <h2>Three steps, <em>every week.</em></h2>
          </div>
          <div className="steps-grid">
            {STEPS.map((s) => (
              <div key={s.n} className="step">
                <div className="step-n">{s.n}</div>
                <h3>{s.title}</h3>
                <p className="muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="land-section">
        <div className="land-inner">
          <div className="section-head">
            <div className="upper faint">Why Tayyari</div>
            <h2>Everything between now and <em>exam day.</em></h2>
            <p className="muted">Built around the habits that actually move ranks: regular papers, honest feedback and a reason to come back.</p>
          </div>
          <div className="feature-grid">
            {FEATURES.map(({ title, text, Art }) => (
              <div key={title} className="feature-card">
                <div className="feature-art"><Art /></div>
                <div>
                  <h3>{title}</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="land-section">
        <div className="land-inner">
          <div className="section-head">
            <div className="upper faint">From students</div>
            <h2>What regular practice <em>feels like.</em></h2>
          </div>
          <div className="reviews">
            {REVIEWS.map((r) => (
              <figure key={r.name} className="review">
                <span className="review-q serif">&ldquo;</span>
                <blockquote>{r.text}</blockquote>
                <figcaption>
                  <span className="avatar" style={{ width: 34, height: 34, fontSize: 14 }}>{r.name[0]}</span>
                  <span><b>{r.name}</b><span className="xs muted" style={{ display: "block" }}>{r.meta}</span></span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="land-cta">
        <Mark size={420} grain spin className="cta-mark" color="var(--cream)" />
        <div style={{ position: "relative" }}>
          <h2>Your next rank starts with <em>one paper.</em></h2>
          <p>Sign up in under a minute with your phone, email or Google.</p>
          <Link href="/login" className="btn btn-lg btn-cream">Get started <ArrowUpRight size={18} /></Link>
        </div>
      </section>

      <footer className="land-foot">
        <Logo />
        <span>Serious practice for JEE Main.</span>
        <span>© {new Date().getFullYear()} Tayyari · tayyari.online</span>
      </footer>
    </div>
  );
}

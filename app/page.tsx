"use client";

import { ArrowRight, Check, Clock } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/AppShell";
import { Icon3D, IconTile, type Icon3DName } from "@/components/Icon3D";

function HeroArt() {
  return (
    <div className="land-art" aria-hidden>
      {/* soft backdrop */}
      <div style={{ position: "absolute", inset: "6% 4% 4% 10%", borderRadius: 32, background: "var(--bg)", border: "1px solid var(--line)" }} />

      {/* question card */}
      <div className="card" style={{ position: "absolute", left: "16%", top: "12%", width: "64%", padding: 0, boxShadow: "var(--shadow-lg)" }}>
        <div className="spread" style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
          <span className="row small" style={{ gap: 8, fontWeight: 700 }}><Icon3D name="atom" size={20} />Physics · Q4</span>
          <span className="timer" style={{ height: 30, fontSize: ".85rem" }}><Clock size={14} />12:40</span>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ height: 10, borderRadius: 6, background: "var(--bg-soft)", width: "92%" }} />
          <div style={{ height: 10, borderRadius: 6, background: "var(--bg-soft)", width: "64%", marginTop: 8 }} />
          {["0.5 J", "1 J", "2 J"].map((o, i) => (
            <div key={o} className={`option static ${i === 1 ? "correct" : ""}`} style={{ marginTop: 10, marginBottom: 0, padding: "9px 12px", fontSize: ".9rem" }}>
              <span className="key">{String.fromCharCode(65 + i)}</span>{o}
              {i === 1 && <Check size={18} style={{ marginLeft: "auto" }} />}
            </div>
          ))}
        </div>
      </div>

      {/* character */}
      <div style={{ position: "absolute", left: "-2%", bottom: "2%", filter: "drop-shadow(0 20px 24px rgba(16,24,40,.18))" }}>
        <Icon3D name="student" size={150} />
      </div>

      {/* trophy */}
      <div style={{ position: "absolute", right: "2%", top: "0%", filter: "drop-shadow(0 16px 20px rgba(16,24,40,.18))", transform: "rotate(8deg)" }}>
        <Icon3D name="trophy" size={96} />
      </div>

      {/* rank card */}
      <div className="card" style={{ position: "absolute", right: "0%", bottom: "8%", padding: 10, width: 220, boxShadow: "var(--shadow-lg)" }}>
        <div className="upper faint" style={{ padding: "4px 8px 6px" }}>This week</div>
        {[["1", "Ananya I.", 412, "#7c5cff"], ["2", "You", 356, "#4f46e5"], ["3", "Rohan D.", 298, "#12a37a"]].map(([r, n, s, c]) => (
          <div key={r as string} className={`lb-row ${n === "You" ? "you" : ""}`} style={{ padding: "6px 8px", gap: 8 }}>
            <span className={`rank rank-${r}`} style={{ width: 14 }}>{r}</span>
            <span className="avatar" style={{ width: 24, height: 24, background: c as string, fontSize: 11 }}>{(n as string)[0]}</span>
            <span className="name small">{n}</span><span className="score small">{s}</span>
          </div>
        ))}
      </div>

      {/* streak chip */}
      <div className="card row" style={{ position: "absolute", right: "30%", bottom: "-2%", padding: "8px 14px", gap: 8, boxShadow: "var(--shadow)" }}>
        <Icon3D name="fire" size={26} />
        <div><div style={{ fontWeight: 800, lineHeight: 1.1 }}>7 days</div><div className="xs muted">streak</div></div>
      </div>
    </div>
  );
}

const FEATURES: { title: string; text: string; icon: Icon3DName; tint: string }[] = [
  { title: "The real exam interface", text: "Question palette, mark for review, +4 / −1 marking and an auto-submitting timer, exactly like test day.", icon: "stopwatch", tint: "var(--tint-amber)" },
  { title: "Rank against everyone", text: "Weekly and all-time leaderboards show where you stand among students preparing with you.", icon: "trophy", tint: "var(--tint-amber)" },
  { title: "Points, streaks and badges", text: "Every paper earns points. Streaks and badges reward the consistency that actually moves your rank.", icon: "medal", tint: "var(--tint-violet)" },
  { title: "Analysis that finds weak spots", text: "Subject and chapter accuracy, time per question and predicted percentile with Pro.", icon: "chart", tint: "var(--tint-blue)" },
];

export default function Landing() {
  return (
    <div className="land">
      <header className="land-nav">
        <Logo />
        <Link href="/login" className="btn btn-white btn-sm">Log in</Link>
      </header>

      <section className="land-hero">
        <div>
          <span className="eyebrow"><Icon3D name="sparkles" size={20} />New papers every Monday</span>
          <h1>Serious JEE practice, <em>without the grind.</em></h1>
          <p className="lead">Full mocks and chapter papers in the real exam format, instant results, and a leaderboard that keeps you showing up every week.</p>
          <div className="row" style={{ gap: 12 }}>
            <Link href="/login" className="btn btn-lg">Start practising free <ArrowRight size={18} /></Link>
            <Link href="/login" className="btn btn-white btn-lg">Log in</Link>
          </div>
          <div className="row muted small" style={{ gap: 18, marginTop: 22 }}>
            <span className="row" style={{ gap: 6 }}><Check size={16} color="var(--green)" />2 free papers a week</span>
            <span className="row" style={{ gap: 6 }}><Check size={16} color="var(--green)" />Full solutions</span>
            <span className="row" style={{ gap: 6 }}><Check size={16} color="var(--green)" />No card needed</span>
          </div>
        </div>
        <HeroArt />
      </section>

      <section className="land-band">
        <div className="land-band-inner">
          <div className="center" style={{ maxWidth: 620, margin: "0 auto 36px" }}>
            <h2 style={{ fontSize: "2rem" }}>Everything you need between now and exam day</h2>
            <p className="muted" style={{ marginTop: 10 }}>Built around the habits that actually move ranks: regular papers, honest feedback and a reason to come back.</p>
          </div>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="card feature-card">
                <IconTile name={f.icon} tint={f.tint} size={56} />
                <h3>{f.title}</h3>
                <p className="small">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="land-cta">
        <div style={{ display: "grid", placeItems: "center", marginBottom: 16 }}><Icon3D name="rocket" size={72} /></div>
        <h2>Your next rank starts with one paper.</h2>
        <p>Sign up in under a minute with your phone, email or Google.</p>
        <Link href="/login" className="btn btn-white btn-lg">Get started <ArrowRight size={18} /></Link>
      </section>

      <footer className="land-foot">© {new Date().getFullYear()} Tayyari · tayyari.online</footer>
    </div>
  );
}

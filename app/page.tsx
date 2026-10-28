"use client";

import { Award, BarChart3, Check, Clock, Flame, Medal, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/AppShell";

function HeroArt() {
  return (
    <div className="land-art" aria-hidden>
      {/* paper */}
      <div className="card" style={{ position: "absolute", left: "8%", top: "6%", width: "72%", padding: 0, borderBottomWidth: 4, transform: "rotate(-3deg)" }}>
        <div style={{ background: "var(--blue)", color: "#fff", padding: "10px 16px", borderRadius: "13px 13px 0 0", display: "flex", justifyContent: "space-between", fontWeight: 900 }}>
          <span>Physics · Q4</span><span style={{ display: "flex", gap: 6, alignItems: "center" }}><Clock size={16} />12:40</span>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ height: 12, borderRadius: 6, background: "var(--line)", width: "92%" }} />
          <div style={{ height: 12, borderRadius: 6, background: "var(--line)", width: "70%", marginTop: 8 }} />
          {["0.5 J", "1 J", "2 J"].map((o, i) => (
            <div key={o} className={`option static ${i === 1 ? "correct" : ""}`} style={{ marginTop: 10, marginBottom: 0, padding: "10px 12px" }}>
              <span className="key">{String.fromCharCode(65 + i)}</span>{o}
              {i === 1 && <Check size={20} style={{ marginLeft: "auto" }} />}
            </div>
          ))}
        </div>
      </div>
      {/* medal */}
      <div style={{ position: "absolute", right: "4%", top: "0%", width: 96, height: 96, borderRadius: "50%", background: "var(--yellow)", boxShadow: "0 6px 0 var(--yellow-dark)", display: "grid", placeItems: "center", color: "#fff", transform: "rotate(8deg)" }}>
        <Trophy size={46} />
      </div>
      {/* streak */}
      <div className="card" style={{ position: "absolute", left: "0%", bottom: "4%", padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", borderBottomWidth: 4 }}>
        <Flame size={30} color="var(--orange)" fill="var(--orange)" />
        <div><div style={{ fontWeight: 900, fontSize: "1.3rem", color: "var(--orange)" }}>7 day</div><div className="xs muted">streak</div></div>
      </div>
      {/* rank */}
      <div className="card" style={{ position: "absolute", right: "0%", bottom: "12%", padding: 12, width: 210, borderBottomWidth: 4 }}>
        {[["1", "Ananya I.", 132, "var(--purple)"], ["2", "You", 128, "var(--blue)"], ["3", "Rohan D.", 120, "var(--green)"]].map(([r, n, s, c]) => (
          <div key={r as string} className={`lb-row ${n === "You" ? "you" : ""}`} style={{ padding: "6px 8px", gap: 8 }}>
            <span className={`rank rank-${r}`} style={{ width: 16 }}>{r}</span>
            <span className="avatar" style={{ width: 24, height: 24, background: c as string, fontSize: 11 }}>{(n as string)[0]}</span>
            <span className="name small">{n}</span><span className="score small">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  { title: "Real exam, zero surprises", text: "Every paper uses the JEE Main interface: question palette, mark for review, +4 / −1 marking and an auto-submitting timer.", icon: Clock, color: "var(--blue)" },
  { title: "Compete with everyone", text: "Weekly and all-time leaderboards show exactly where you stand. Climb a few spots every week.", icon: Trophy, color: "var(--yellow)" },
  { title: "Collect badges and points", text: "Earn points for every paper and unlock badges for streaks, accuracy and subject mastery.", icon: Award, color: "var(--purple)" },
  { title: "Know your weak chapters", text: "See accuracy by subject and chapter, time per question, and predicted percentile with Pro.", icon: BarChart3, color: "var(--green)" },
];

export default function Landing() {
  return (
    <div>
      <header className="land-nav">
        <Logo />
        <Link href="/login" className="btn btn-white btn-sm">Log in</Link>
      </header>

      <section className="land-hero">
        <div>
          <h1>The free, fun way to <em>crack JEE</em>.</h1>
          <p className="lead">Fresh mock papers every week, instant results, leaderboards and badges that keep you coming back.</p>
          <div className="stack-sm" style={{ maxWidth: 340 }}>
            <Link href="/login" className="btn btn-lg btn-block">Get started</Link>
            <Link href="/login" className="btn btn-white btn-lg btn-block">I already have an account</Link>
          </div>
        </div>
        <HeroArt />
      </section>

      <section className="land-band">
        <div className="land-band-inner">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="land-feature" style={{ direction: i % 2 ? "rtl" : "ltr" }}>
              <div style={{ direction: "ltr" }}>
                <h2 style={{ color: f.color === "var(--yellow)" ? "var(--yellow-dark)" : f.color }}>{f.title}</h2>
                <p>{f.text}</p>
              </div>
              <div style={{ direction: "ltr", display: "grid", placeItems: "center" }}>
                <div style={{ width: 180, height: 180, borderRadius: 40, background: f.color, display: "grid", placeItems: "center", color: "#fff", boxShadow: "0 8px 0 rgba(0,0,0,.15)", transform: `rotate(${i % 2 ? 4 : -4}deg)` }}>
                  <f.icon size={84} strokeWidth={2.2} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="land-cta">
        <h2>Your next rank starts with one paper.</h2>
        <div className="row" style={{ justifyContent: "center", gap: 18, marginBottom: 28, fontWeight: 800 }}>
          <span className="row" style={{ gap: 6 }}><Zap size={20} fill="#fff" />Free every week</span>
          <span className="row" style={{ gap: 6 }}><Medal size={20} />12 badges</span>
          <span className="row" style={{ gap: 6 }}><Trophy size={20} />Live leaderboards</span>
        </div>
        <Link href="/login" className="btn btn-white btn-lg" style={{ color: "var(--green-dark)" }}>Get started</Link>
      </section>

      <footer className="land-foot">© {new Date().getFullYear()} Tayyari · tayyari.online</footer>
    </div>
  );
}

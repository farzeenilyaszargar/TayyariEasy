"use client";

import { useApp } from "@/components/AppProvider";
import { FREE_TESTS_PER_WEEK, PRO_PRICE_LABEL } from "@/lib/config";

const FREE = [
  `${FREE_TESTS_PER_WEEK} tests every week (full, subject or chapter)`,
  "Score, rank, accuracy & subject-wise breakdown",
  "Answers with full solutions",
  "Leaderboards & badges",
];
const PRO = [
  "Unlimited tests & reattempts",
  "Percentile & rank prediction",
  "Chapter-wise strengths and weaknesses",
  "Time-per-question & difficulty analysis",
  "Silly-mistake and guess detection",
  "Progress tracking across attempts",
];

export default function PricingPage() {
  const { user, setPlan } = useApp();
  const isPro = user?.plan === "pro";

  return (
    <div className="container page stack">
      <div className="center">
        <h1>Simple plans</h1>
        <p className="muted">Practice is free. Go Pro when you want to know exactly where your marks are going.</p>
      </div>
      <div className="grid" style={{ maxWidth: 760, margin: "24px auto 0" }}>
        <div className="card stack">
          <h2>Free</h2>
          <div className="v" style={{ fontSize: "2rem", fontWeight: 800 }}>₹0</div>
          <ul>{FREE.map((f) => <li key={f}>{f}</li>)}</ul>
          {user && !isPro ? <span className="chip chip-green">Current plan</span>
            : isPro ? <button className="btn btn-ghost" onClick={() => setPlan("free")}>Switch to Free</button> : null}
        </div>
        <div className="card stack" style={{ borderColor: "var(--purple)", borderWidth: 2 }}>
          <h2>Pro <span className="pro-tag">PRO</span></h2>
          <div className="v" style={{ fontSize: "1.3rem", fontWeight: 800 }}>{PRO_PRICE_LABEL}</div>
          <p className="muted small">Everything in Free, plus:</p>
          <ul>{PRO.map((f) => <li key={f}>{f}</li>)}</ul>
          {isPro ? <span className="chip">Current plan</span>
            : <button className="btn" disabled={!user} onClick={() => setPlan("pro")}>{user ? "Activate Pro (demo)" : "Log in to upgrade"}</button>}
          <p className="muted small">Payments aren&apos;t live yet — the demo button switches your plan so you can preview Pro features.</p>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { FREE_TESTS_PER_WEEK } from "@/lib/config";
import { PRO_PLANS, rupees, type ProPlan } from "@/lib/plans";

const FREE = [
  `${FREE_TESTS_PER_WEEK} tests every week (full, subject or chapter)`,
  "Score, rank, accuracy & subject-wise breakdown",
  "Answers with full solutions",
  "Leaderboards, badges & points",
];
const PRO = [
  "Unlimited tests & reattempts",
  "Percentile & rank prediction",
  "Chapter-wise strengths and weaknesses",
  "Time-per-question & difficulty analysis",
  "Silly-mistake and guess detection",
  "Progress tracking across attempts",
];

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global { interface Window { Razorpay?: any } }

function loadCheckout() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Razorpay. Check your connection."));
    document.body.appendChild(s);
  });
}

export default function PricingPage() {
  const { user, refresh } = useApp();
  const [planId, setPlanId] = useState<ProPlan["id"]>("pro_yearly");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const isPro = user?.plan === "pro";
  const plan = PRO_PLANS.find((p) => p.id === planId)!;

  async function buy() {
    setBusy(true); setMsg(null);
    try {
      await loadCheckout();
      const res = await fetch("/api/razorpay/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId }) });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error);

      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "Tayyari",
        description: `Tayyari Pro — ${plan.label}`,
        prefill: { name: user?.name ?? "", ...order.prefill },
        theme: { color: "#5b3df5" },
        handler: async (resp: any) => {
          const v = await fetch("/api/razorpay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(resp) });
          const out = await v.json();
          if (v.ok) {
            await refresh();
            setMsg({ ok: true, text: "🎉 Welcome to Tayyari Pro! Deep analysis is now unlocked." });
          } else {
            setMsg({ ok: false, text: out.error ?? "Payment received but verification failed — it will activate shortly." });
          }
          setBusy(false);
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on("payment.failed", (r: any) => { setMsg({ ok: false, text: r.error?.description ?? "Payment failed." }); setBusy(false); });
      rzp.open();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) });
      setBusy(false);
    }
  }

  return (
    <div className="container page stack">
      <div className="center">
        <div className="eyebrow">Pricing</div>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)" }}>Practice is free. Insight is Pro.</h1>
        <p className="muted">Go Pro when you want to know exactly where your marks are going.</p>
      </div>

      <div className="center">
        <div className="tabs">
          {PRO_PLANS.map((p) => (
            <button key={p.id} className={`tab ${planId === p.id ? "active" : ""}`} onClick={() => setPlanId(p.id)}>
              {p.label}{p.id === "pro_yearly" && <span className="chip chip-green" style={{ marginLeft: 6 }}>Save more</span>}
            </button>
          ))}
        </div>
      </div>

      {msg && <div className={`banner ${msg.ok ? "banner-info" : ""}`} style={{ maxWidth: 760, margin: "16px auto 0" }}>{msg.text}</div>}

      <div className="grid" style={{ maxWidth: 760, margin: "24px auto 0" }}>
        <div className="card price-card">
          <h2>Free</h2>
          <div className="price">₹0</div>
          <ul className="checklist">{FREE.map((f) => <li key={f}>{f}</li>)}</ul>
          <div style={{ marginTop: "auto" }}>
            {!user ? <Link href="/login" className="btn btn-ghost btn-block">Start free</Link>
              : !isPro ? <span className="chip chip-green">Your current plan</span> : null}
          </div>
        </div>
        <div className="card price-card featured">
          <h2>Pro <span className="pro-tag">PRO</span></h2>
          <div><span className="price">{rupees(plan.amountPaise)}</span> <span className="muted">{plan.periodLabel}</span></div>
          <p className="muted small" style={{ margin: 0 }}>Everything in Free, plus:</p>
          <ul className="checklist">{PRO.map((f) => <li key={f}>{f}</li>)}</ul>
          <div style={{ marginTop: "auto" }}>
            {!user ? <Link href="/login?next=/pricing" className="btn btn-block">Log in to upgrade</Link>
              : <button className="btn btn-block btn-lg" onClick={buy} disabled={busy}>
                  {busy ? "Opening checkout…" : isPro ? `Extend Pro — ${rupees(plan.amountPaise)}` : `Get Pro — ${rupees(plan.amountPaise)}`}
                </button>}
            {isPro && user?.proUntil && <p className="muted small center" style={{ marginTop: 8 }}>Pro active until {new Date(user.proUntil).toLocaleDateString()}</p>}
            <p className="muted small center" style={{ marginTop: 8, marginBottom: 0 }}>Secure payment via Razorpay · UPI, cards, netbanking</p>
          </div>
        </div>
      </div>
    </div>
  );
}

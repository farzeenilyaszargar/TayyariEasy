"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Notice, PageHead } from "@/components/ui";
import { FREE_TESTS_PER_WEEK } from "@/lib/config";
import { PRO_PLANS, rupees, type ProPlan } from "@/lib/plans";

const FREE = [
  `${FREE_TESTS_PER_WEEK} tests a week: full, subject or chapter`,
  "Score, rank, accuracy and subject breakdown",
  "Solutions for every question",
  "Leaderboards, badges and points",
];
const PRO = [
  "Unlimited tests and reattempts",
  "Predicted percentile and rank",
  "Chapter-wise strengths and weaknesses",
  "Time per question and difficulty analysis",
  "Careless-mistake and guess detection",
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
        description: `Tayyari Pro, ${plan.label.toLowerCase()}`,
        prefill: { name: user?.name ?? "", ...order.prefill },
        theme: { color: "#1b1b19" },
        handler: async (resp: any) => {
          const v = await fetch("/api/razorpay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(resp) });
          const out = await v.json();
          if (v.ok) {
            await refresh();
            setMsg({ ok: true, text: "Payment received. Pro is now active on your account." });
          } else {
            setMsg({ ok: false, text: out.error ?? "Payment received but not yet confirmed. Pro will activate shortly." });
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
    <div className="page page-narrow stack">
      <PageHead title={isPro ? "Your plan" : "Upgrade to Pro"} sub="Practice stays free. Pro adds unlimited tests and detailed analysis." />

      {isPro && user?.proUntil && <Notice kind="ok">Pro is active until {new Date(user.proUntil).toLocaleDateString("en-IN", { dateStyle: "long" })}.</Notice>}
      {msg && <Notice kind={msg.ok ? "ok" : "error"}>{msg.text}</Notice>}

      <div className="seg">
        {PRO_PLANS.map((p) => <button key={p.id} className={planId === p.id ? "active" : ""} onClick={() => setPlanId(p.id)}>{p.label}</button>)}
      </div>

      <div className="cols-2">
        <div className="card plan-card">
          <div>
            <h2>Free</h2>
            <div className="price" style={{ marginTop: 6 }}>₹0</div>
          </div>
          <ul className="checklist">{FREE.map((f) => <li key={f}><Check size={15} strokeWidth={2.2} />{f}</li>)}</ul>
          <div style={{ marginTop: "auto" }}>
            {!user ? <Link href="/login" className="btn btn-secondary btn-block">Get started</Link>
              : !isPro ? <p className="muted small">Your current plan</p> : null}
          </div>
        </div>
        <div className="card plan-card featured">
          <div>
            <h2>Pro</h2>
            <div style={{ marginTop: 6 }}><span className="price num">{rupees(plan.amountPaise)}</span> <span className="muted">{plan.periodLabel}</span></div>
          </div>
          <ul className="checklist">{PRO.map((f) => <li key={f}><Check size={15} strokeWidth={2.2} />{f}</li>)}</ul>
          <div style={{ marginTop: "auto" }}>
            {!user ? <Link href="/login?next=/pricing" className="btn btn-block">Log in to upgrade</Link>
              : <button className="btn btn-block btn-lg" onClick={buy} disabled={busy}>
                  {busy ? "Opening checkout…" : isPro ? `Extend by ${plan.days} days` : `Upgrade for ${rupees(plan.amountPaise)}`}
                </button>}
            <p className="muted xs center" style={{ marginTop: 10 }}>Payments by Razorpay. UPI, cards and netbanking.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Check, Crown } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Notice } from "@/components/ui";
import { FREE_TESTS_PER_WEEK } from "@/lib/config";
import { PRO_PLANS, rupees, type ProPlan } from "@/lib/plans";

const FREE = [`${FREE_TESTS_PER_WEEK} papers every week`, "Score, rank and accuracy", "Solutions for every question", "Leaderboards, badges and points"];
const PRO = ["Unlimited papers and retries", "Predicted percentile and rank", "Chapter-wise weak spots", "Time per question analysis", "Careless-mistake detection", "Score trend over time"];

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

export default function ProPage() {
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
        key: order.keyId, order_id: order.orderId, amount: order.amount, currency: order.currency,
        name: "Tayyari", description: `Tayyari Pro, ${plan.label.toLowerCase()}`,
        prefill: { name: user?.name ?? "", ...order.prefill },
        theme: { color: "#ce82ff" },
        handler: async (resp: any) => {
          const v = await fetch("/api/razorpay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(resp) });
          const out = await v.json();
          if (v.ok) { await refresh(); setMsg({ ok: true, text: "Welcome to Pro! Everything is unlocked." }); }
          else setMsg({ ok: false, text: out.error ?? "Payment received but not confirmed yet. Pro will activate shortly." });
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
      <div className="center stack-sm">
        <div style={{ width: 84, height: 84, margin: "0 auto", borderRadius: 24, background: "var(--purple)", boxShadow: "0 5px 0 var(--purple-dark)", display: "grid", placeItems: "center", color: "#fff" }}>
          <Crown size={44} />
        </div>
        <h1>{isPro ? "You're on Pro" : "Go further with Pro"}</h1>
        <p className="muted">Practice is always free. Pro adds unlimited papers and analysis that shows exactly where your marks go.</p>
      </div>

      {isPro && user?.proUntil && <Notice kind="green">Pro is active until {new Date(user.proUntil).toLocaleDateString("en-IN", { dateStyle: "long" })}.</Notice>}
      {msg && <Notice kind={msg.ok ? "green" : "red"}>{msg.text}</Notice>}

      <div className="chips" style={{ justifyContent: "center" }}>
        {PRO_PLANS.map((p) => <button key={p.id} className={`chip-btn ${planId === p.id ? "active" : ""}`} onClick={() => setPlanId(p.id)}>{p.label}</button>)}
      </div>

      <div className="cols-2">
        <div className="card plan">
          <div><h2>Free</h2><div className="price">₹0</div></div>
          <ul className="checklist">{FREE.map((f) => <li key={f}><Check size={18} strokeWidth={3} />{f}</li>)}</ul>
          {!isPro && <p className="muted small" style={{ marginTop: "auto" }}>Your current plan</p>}
        </div>
        <div className="card plan featured">
          <div className="spread"><h2>Pro</h2><span className="tag tag-pro">Best value</span></div>
          <div><span className="price num">{rupees(plan.amountPaise)}</span> <span className="muted">{plan.periodLabel}</span></div>
          <ul className="checklist">{PRO.map((f) => <li key={f}><Check size={18} strokeWidth={3} />{f}</li>)}</ul>
          <div style={{ marginTop: "auto" }}>
            <button className="btn btn-purple btn-block btn-lg" onClick={buy} disabled={busy}>
              {busy ? "Opening…" : isPro ? `Extend ${plan.days} days` : "Get Pro"}
            </button>
            <p className="muted xs center" style={{ marginTop: 10 }}>Secure payment by Razorpay · UPI, cards, netbanking</p>
          </div>
        </div>
      </div>
    </div>
  );
}

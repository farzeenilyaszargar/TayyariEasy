"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Medallion } from "@/components/Icon";
import { Notice, Segmented } from "@/components/ui";
import { FREE_TESTS_PER_WEEK } from "@/lib/config";
import { PRO_PLANS, type ProPlan } from "@/lib/plans";

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

// Serif amount with the ₹ sign kept in the regular sans face.
function Price({ paise }: { paise: number }) {
  return <span className="price num"><span className="cur">₹</span>{(paise / 100).toLocaleString("en-IN")}</span>;
}

export default function ProPage() {
  const { user, refresh } = useApp();
  const [planId, setPlanId] = useState<ProPlan["id"]>("pro_monthly");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const isPro = user?.plan === "pro";
  const plan = PRO_PLANS.find((p) => p.id === planId)!;
  const [monthly, yearly] = [PRO_PLANS.find((p) => p.id === "pro_monthly")!, PRO_PLANS.find((p) => p.id === "pro_yearly")!];
  const savePct = Math.round((1 - yearly.amountPaise / (monthly.amountPaise * 12)) * 100);

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
        theme: { color: "#1d1c1a" },
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
        <div style={{ display: "grid", placeItems: "center" }}><Medallion name="crown" size={64} /></div>
        <h1>{isPro ? <>You&apos;re on <em>Pro</em></> : <>Go further with <em>Pro</em></>}</h1>
        <p className="muted">Practice is always free. Pro adds unlimited papers and analysis that shows exactly where your marks go.</p>
      </div>

      {isPro && user?.proUntil && <Notice kind="green">Pro is active until {new Date(user.proUntil).toLocaleDateString("en-IN", { dateStyle: "long" })}.</Notice>}
      {msg && <Notice kind={msg.ok ? "green" : "red"}>{msg.text}</Notice>}

      <div style={{ display: "flex", justifyContent: "center" }}>
        <Segmented value={planId} onChange={setPlanId}
          options={PRO_PLANS.map((p) => ({ key: p.id, label: p.id === "pro_yearly" && savePct > 0 ? <>{p.label}<span className="save">−{savePct}%</span></> : p.label }))} />
      </div>

      <div className="plans">
        <div className="card plan">
          <div className="spread"><h2>Free</h2>{!isPro && <span className="tag">Current plan</span>}</div>
          <div><Price paise={0} /> <span className="muted">forever</span><p className="muted xs price-note">No card needed.</p></div>
          <ul className="checklist">{FREE.map((f) => <li key={f}><Check size={18} strokeWidth={2.4} />{f}</li>)}</ul>
        </div>
        <div className="card plan featured">
          <div className="spread"><h2>Pro</h2><span className="tag tag-pro">{planId === "pro_yearly" ? "Best value" : "Most flexible"}</span></div>
          <div>
            <Price paise={plan.amountPaise} /> <span className="muted">{plan.periodLabel}</span>
            <p className="muted xs price-note">{planId === "pro_yearly" ? `Works out to ₹${Math.round(plan.amountPaise / 1200)} a month.` : "Cancel any time."}</p>
          </div>
          <ul className="checklist">{PRO.map((f) => <li key={f}><Check size={18} strokeWidth={2.4} />{f}</li>)}</ul>
          <div style={{ marginTop: "auto" }}>
            <button className="btn btn-block btn-lg" onClick={buy} disabled={busy}>
              {busy ? "Opening…" : isPro ? `Extend ${plan.days} days` : "Get Pro"}
            </button>
            <p className="muted xs center" style={{ marginTop: 10 }}>Secure payment by Razorpay · UPI, cards, netbanking</p>
          </div>
        </div>
      </div>
    </div>
  );
}

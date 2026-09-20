"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { getStoredSession } from "@/lib/supabase-auth";

type BillingStatus = { plan: "free" | "pro"; freeTestsRemaining: number };
type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function authHeaders() {
  const token = getStoredSession()?.accessToken;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function PricingPlans() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) { setBilling(null); return; }
    fetch("/api/billing/status", { headers: authHeaders(), cache: "no-store" })
      .then((res) => res.ok ? res.json() as Promise<BillingStatus> : null)
      .then(setBilling)
      .catch(() => setBilling(null));
  }, [isLoggedIn]);

  const upgrade = async () => {
    if (!isLoggedIn) { router.push("/auth?next=/pricings"); return; }
    setLoading(true); setMessage("");
    try {
      const orderResponse = await fetch("/api/payments/create-order", { method: "POST", headers: authHeaders() });
      const order = await orderResponse.json() as { orderId?: string; amount?: number; currency?: string; keyId?: string; error?: string };
      if (!orderResponse.ok || !order.orderId || !order.keyId) throw new Error(order.error || "Unable to begin checkout.");
      if (!(await loadRazorpay()) || !window.Razorpay) throw new Error("Razorpay checkout could not load. Please check your connection and try again.");
      const checkout = new window.Razorpay({
        key: order.keyId, amount: order.amount, currency: order.currency, name: "Tayyari", description: "Pro lifetime access",
        order_id: order.orderId, prefill: { name: user.name }, theme: { color: "#111827" },
        handler: async (response: RazorpayResponse) => {
          const verifyResponse = await fetch("/api/payments/verify", { method: "POST", headers: authHeaders(), body: JSON.stringify(response) });
          const verified = await verifyResponse.json() as { error?: string };
          if (!verifyResponse.ok) { setMessage(verified.error || "Payment was received but we could not activate Pro yet. Please contact support."); return; }
          setBilling({ plan: "pro", freeTestsRemaining: 0 });
          setMessage("Payment confirmed — Pro lifetime access is now active.");
        },
        modal: { ondismiss: () => setLoading(false) }
      });
      checkout.open();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to start checkout."); }
    finally { setLoading(false); }
  };

  return <section className="pricing-page">
    <header className="pricing-head"><span>Simple access</span><h1>Practice seriously. Pay once.</h1><p>Start free, then unlock every Tayyari mock and the analysis that helps you improve.</p></header>
    <div className="pricing-grid">
      <article className="pricing-card"><div><span className="pricing-label">Free</span><h2>₹0</h2><p className="pricing-period">Always free</p></div><p className="pricing-description">A low-pressure way to see how Tayyari fits your preparation.</p><ul><li>1 full mock test every week</li><li>NTA-style exam experience</li><li>Basic score report</li></ul><button className="btn btn-outline pricing-button" onClick={() => isLoggedIn ? router.push("/tests") : router.push("/auth?next=/tests")}>Start free</button></article>
      <article className="pricing-card pricing-card-pro"><div className="pricing-topline"><span className="pricing-label">Pro</span><span className="pricing-badge">Best value</span></div><div><h2>₹199</h2><p className="pricing-period">One-time · lifetime access</p></div><p className="pricing-description">Everything you need to turn consistent practice into a sharper JEE attempt.</p><ul><li>Unlimited full mock tests</li><li>Subject and topic practice</li><li>Advanced performance analysis</li><li>Detailed accuracy and weak-area insights</li></ul><button className="btn btn-solid pricing-button" onClick={upgrade} disabled={loading || billing?.plan === "pro"}>{billing?.plan === "pro" ? "Pro is active" : loading ? "Opening checkout..." : "Get Pro lifetime"}</button></article>
    </div>
    <p className="pricing-note">{message || (billing?.plan === "free" ? `${billing.freeTestsRemaining} free test this week.` : "Secure payments are processed by Razorpay.")}</p>
  </section>;
}

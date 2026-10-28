"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { supabase } from "@/lib/supabase/client";

type Method = "phone" | "email";

function Login() {
  const { user, ready } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";

  const [method, setMethod] = useState<Method>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(params.get("error") ? "Sign-in failed. Please try again." : "");

  useEffect(() => {
    if (ready && user) router.replace(next);
  }, [ready, user, next, router]);

  const fullPhone = `+91${phone.replace(/\D/g, "").slice(-10)}`;
  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function run(fn: () => Promise<{ error: { message: string } | null }>) {
    setBusy(true); setError("");
    try {
      const { error } = await fn();
      if (error) setError(error.message);
      return !error;
    } finally {
      setBusy(false);
    }
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run(() =>
      method === "phone"
        ? supabase().auth.signInWithOtp({ phone: fullPhone })
        : supabase().auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirectTo() } }),
    );
    if (ok) setSent(true);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    await run(() =>
      method === "phone"
        ? supabase().auth.verifyOtp({ phone: fullPhone, token: code.trim(), type: "sms" })
        : supabase().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" }),
    );
    // onAuthStateChange in AppProvider picks up the session; the effect above redirects.
  }

  const google = () => run(() => supabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } }));

  return (
    <div className="auth-wrap">
      <div className="card auth-card stack">
        <div className="center">
          <h2>Welcome to Tayyari</h2>
          <p className="muted small">Log in or sign up to save scores, climb the leaderboard and earn badges.</p>
        </div>

        <button className="btn btn-ghost btn-block" onClick={google} disabled={busy}>
          <GoogleIcon /> Continue with Google
        </button>
        <div className="divider">or</div>

        <div className="tabs" style={{ display: "flex" }}>
          {(["phone", "email"] as const).map((m) => (
            <button key={m} className={`tab ${method === m ? "active" : ""}`} style={{ flex: 1 }}
              onClick={() => { setMethod(m); setSent(false); setCode(""); setError(""); }}>
              {m === "phone" ? "📱 Mobile" : "✉️ Email"}
            </button>
          ))}
        </div>

        {!sent ? (
          <form className="stack" onSubmit={sendCode}>
            {method === "phone" ? (
              <div>
                <label htmlFor="phone">Mobile number</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <span className="chip chip-gray" style={{ borderRadius: 12, padding: "0 12px" }}>+91</span>
                  <input id="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210"
                    value={phone} onChange={(e) => setPhone(e.target.value)} required pattern="[0-9 ]{10,12}" />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="email">Email</label>
                <input id="email" type="email" autoComplete="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            )}
            <button className="btn btn-block" type="submit" disabled={busy}>{busy ? "Sending…" : "Send OTP"}</button>
          </form>
        ) : (
          <form className="stack" onSubmit={verify}>
            <p className="small muted" style={{ margin: 0 }}>
              {method === "phone"
                ? <>We sent a 6-digit code to <b>{fullPhone}</b>.</>
                : <>We sent an email to <b>{email}</b>. Click the link in it, or enter the code if it has one.</>}
            </p>
            <div>
              <label htmlFor="code">Code</label>
              <input id="code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={8}
                value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
            <button className="btn btn-block" type="submit" disabled={busy}>{busy ? "Verifying…" : "Verify & continue"}</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSent(false)}>Change {method === "phone" ? "number" : "email"}</button>
          </form>
        )}

        {error && <div className="banner" style={{ background: "var(--red-soft)", color: "#b42326", borderColor: "#f5c2c3" }}>{error}</div>}
        <p className="muted small center" style={{ margin: 0 }}>By continuing you agree to our terms. <Link href="/">Back home</Link></p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function LoginPage() {
  return <Suspense><Login /></Suspense>;
}

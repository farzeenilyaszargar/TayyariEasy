"use client";

import { ArrowLeft, Mail, Smartphone, Trophy, Zap, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Notice } from "@/components/ui";
import { supabase } from "@/lib/supabase/client";

type Method = "phone" | "email";

function SidePanel() {
  return (
    <aside className="auth-side">
      <div style={{ position: "relative", width: 240, height: 200 }} aria-hidden>
        <div style={{ position: "absolute", left: 20, top: 30, width: 150, height: 170, borderRadius: 18, background: "#fff", boxShadow: "0 6px 0 rgba(0,0,0,.15)", transform: "rotate(-8deg)", display: "grid", placeItems: "center", color: "var(--blue)" }}>
          <FileText size={70} />
        </div>
        <div style={{ position: "absolute", right: 10, top: 0, width: 92, height: 92, borderRadius: "50%", background: "var(--yellow)", boxShadow: "0 6px 0 var(--yellow-dark)", display: "grid", placeItems: "center", color: "#fff" }}>
          <Trophy size={44} />
        </div>
        <div style={{ position: "absolute", right: 30, bottom: 0, width: 70, height: 70, borderRadius: 20, background: "var(--blue)", boxShadow: "0 6px 0 var(--blue-dark)", display: "grid", placeItems: "center", color: "#fff", transform: "rotate(10deg)" }}>
          <Zap size={36} fill="#fff" />
        </div>
      </div>
      <h2>Practice that actually feels good.</h2>
      <p>Weekly JEE papers, instant results and a leaderboard full of students just like you.</p>
    </aside>
  );
}

function Login() {
  const { user, ready } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/papers";

  const [method, setMethod] = useState<Method>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(params.get("error") ? "Sign-in failed. Please try again." : "");

  useEffect(() => { if (ready && user) router.replace(next); }, [ready, user, next, router]);

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
  }

  const google = () => run(() => supabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } }));

  return (
    <div className="auth">
      <SidePanel />
      <main className="auth-main">
        <div className="auth-card stack">
          <Link href="/" className="row muted small" style={{ gap: 6 }}><ArrowLeft size={18} />Back</Link>
          <div>
            <h1>{sent ? "Enter your code" : "Log in or sign up"}</h1>
            <p className="muted" style={{ marginTop: 6 }}>
              {sent
                ? method === "phone" ? `We sent a 6-digit code to ${fullPhone}.` : `We emailed ${email}. Tap the link or type the code.`
                : "New here? We'll create your account automatically."}
            </p>
          </div>

          {!sent ? (
            <>
              <button className="btn btn-white btn-block" onClick={google} disabled={busy} style={{ color: "var(--text-strong)" }}>
                <GoogleIcon /> Continue with Google
              </button>
              <div className="or">or</div>
              <div className="chips">
                <button className={`chip-btn ${method === "phone" ? "active" : ""}`} onClick={() => { setMethod("phone"); setError(""); }} style={{ flex: 1 }}>
                  <Smartphone size={16} style={{ verticalAlign: -3, marginRight: 6 }} />Mobile
                </button>
                <button className={`chip-btn ${method === "email" ? "active" : ""}`} onClick={() => { setMethod("email"); setError(""); }} style={{ flex: 1 }}>
                  <Mail size={16} style={{ verticalAlign: -3, marginRight: 6 }} />Email
                </button>
              </div>
              <form className="stack-sm" onSubmit={sendCode}>
                {method === "phone" ? (
                  <div className="input-prefix">
                    <span>+91</span>
                    <input type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="Mobile number" aria-label="Mobile number"
                      value={phone} onChange={(e) => setPhone(e.target.value)} required pattern="[0-9 ]{10,12}" />
                  </div>
                ) : (
                  <input type="email" autoComplete="email" placeholder="Email address" aria-label="Email address"
                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                )}
                <button className="btn btn-blue btn-block btn-lg" type="submit" disabled={busy}>{busy ? "Sending…" : "Send code"}</button>
              </form>
            </>
          ) : (
            <form className="stack-sm" onSubmit={verify}>
              <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={8} placeholder="6-digit code" aria-label="Code"
                value={code} onChange={(e) => setCode(e.target.value)} required style={{ letterSpacing: ".3em", textAlign: "center", fontSize: "1.3rem" }} />
              <button className="btn btn-block btn-lg" type="submit" disabled={busy}>{busy ? "Checking…" : "Continue"}</button>
              <button type="button" className="btn btn-ghost btn-block" onClick={() => { setSent(false); setCode(""); }}>
                Use a different {method === "phone" ? "number" : "email"}
              </button>
            </form>
          )}

          {error && <Notice kind="red">{error}</Notice>}
          <p className="faint xs center">By continuing you agree to Tayyari&apos;s terms and privacy policy.</p>
        </div>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
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

"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import {
  getOAuthErrorFromHash,
  hasSupabaseConfig,
  sendPhoneOtp,
  startGoogleOAuth,
  verifyPhoneOtp
} from "@/lib/supabase-auth";

export default function LoginPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState<"google" | "phone" | "verify" | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/");
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    const oauthError = getOAuthErrorFromHash();
    if (oauthError) {
      setError(oauthError);
    }
  }, []);

  const onGoogleSignIn = async () => {
    setError("");
    setMessage("");
    setLoading("google");
    try {
      await startGoogleOAuth(`${window.location.origin}/login`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start Google login.");
      setLoading(null);
    }
  };

  const onSendOtp = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading("phone");
    try {
      await sendPhoneOtp(phone.trim());
      setOtpSent(true);
      setMessage("OTP sent successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP.");
    } finally {
      setLoading(null);
    }
  };

  const onVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading("verify");
    try {
      await verifyPhoneOtp(phone.trim(), otp.trim());
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid OTP.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="page login-page">
      <div className="login-shell">
        <article className="card login-card">
          <p className="eyebrow">Secure Sign In</p>
          <h1>Login to Tayyari</h1>
          <p className="muted">Use Google or phone number OTP to access your dashboard and analytics.</p>

          {!hasSupabaseConfig() ? (
            <p className="login-alert">
              Authentication is not configured. Add the required environment variables in
              <code> .env.local</code>.
            </p>
          ) : null}

          <div className="login-actions">
            <button className="btn btn-solid login-google" onClick={onGoogleSignIn} disabled={loading !== null}>
              <Image src="/google.png" alt="" width={16} height={16} className="login-google-icon" />
              {loading === "google" ? "Redirecting..." : "Continue with Google"}
            </button>
          </div>

          <div className="login-divider">
            <span>or use phone OTP</span>
          </div>

          <form className="login-form" onSubmit={otpSent ? onVerifyOtp : onSendOtp}>
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+91XXXXXXXXXX"
              required
            />

            {otpSent ? (
              <>
                <label htmlFor="otp">OTP Code</label>
                <input
                  id="otp"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="Enter 6-digit OTP"
                  required
                />
              </>
            ) : null}

            <button
              className="btn btn-outline login-phone"
              type="submit"
              disabled={loading !== null || !hasSupabaseConfig()}
            >
              <Image src="/phone.png" alt="" width={16} height={16} className="login-phone-icon" />
              {otpSent
                ? loading === "verify"
                  ? "Verifying..."
                  : "Verify OTP"
                : loading === "phone"
                  ? "Sending..."
                  : "Send OTP"}
            </button>
          </form>

          {message ? <p className="login-success">{message}</p> : null}
          {error ? <p className="login-error">{error}</p> : null}
        </article>
      </div>
    </section>
  );
}

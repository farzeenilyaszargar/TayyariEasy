"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn, signInWithGoogle, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const requestedNext = params.get("next") || "";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/tests";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (mode === "signin") {
        await signIn(email, password);
        router.replace(next);
      } else {
        const result = await signUp(email, password);
        if (result.needsEmailConfirmation) {
          setMessage("Check your inbox to confirm your email, then sign in.");
          setMode("signin");
        } else {
          router.replace(next);
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    setMessage("");
    try { await signInWithGoogle(`${window.location.origin}${next}`); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Google sign-in could not start."); setLoading(false); }
  };

  return <section className="auth-page"><div className="auth-card">
    <span className="auth-kicker">Tayyari account</span>
    <h1>{mode === "signin" ? "Welcome back." : "Start preparing with clarity."}</h1>
    <p>{mode === "signin" ? "Sign in to save your tests and progress." : "Create your free account in under a minute."}</p>
    <button type="button" className="auth-google" onClick={google} disabled={loading}><span>G</span> Continue with Google</button>
    <div className="auth-divider"><span>or continue with email</span></div>
    <form onSubmit={submit} className="auth-form">
      <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" /></label>
      <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="At least 6 characters" /></label>
      <button className="btn btn-solid auth-submit" disabled={loading}>{loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}</button>
    </form>
    {message ? <p className="auth-message" role="status">{message}</p> : null}
    <p className="auth-switch">{mode === "signin" ? "New to Tayyari?" : "Already have an account?"} <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>{mode === "signin" ? "Create one" : "Sign in"}</button></p>
  </div></section>;
}

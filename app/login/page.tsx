"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";

export default function LoginPage() {
  const { login, user, logout } = useApp();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  if (user) {
    return (
      <div className="container page">
        <div className="card" style={{ maxWidth: 420, margin: "0 auto" }}>
          <h2>Signed in as {user.name}</h2>
          <p className="muted">{user.email}</p>
          <button className="btn btn-ghost" onClick={logout}>Log out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card stack">
        <div className="center"><h2>Welcome to Tayyari</h2><p className="muted small">Log in to save scores, climb the leaderboard and earn badges.</p></div>
        <div className="stack">
          <button className="btn btn-ghost btn-block" disabled>Continue with Google (soon)</button>
          <button className="btn btn-ghost btn-block" disabled>Continue with phone OTP (soon)</button>
          <button className="btn btn-ghost btn-block" disabled>Email magic link (soon)</button>
        </div>
        <div className="divider">or use a demo account</div>
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            login(name.trim(), email.trim());
            router.push("/tests");
          }}
        >
          <div><label htmlFor="name">Name</label><input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div><label htmlFor="email">Email (optional)</label><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <button className="btn btn-block" type="submit">Continue</button>
        </form>
      </div>
    </div>
  );
}

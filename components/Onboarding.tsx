"use client";

import { useState } from "react";
import { updateProfile } from "@/lib/api";
import { useApp } from "./AppProvider";

// New accounts (phone/email sign-ups have no name) pick a display name first.
export function Onboarding() {
  const { user, refresh } = useApp();
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!user) return null;

  const thisYear = new Date().getFullYear();
  return (
    <div className="auth-wrap">
      <form
        className="card auth-card stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await updateProfile(user.id, { full_name: name.trim(), target_year: year ? Number(year) : null });
            await refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.3rem" }}>Set up your profile</h1>
          <p className="muted small" style={{ marginTop: 4 }}>Your name appears on leaderboards as first name and last initial.</p>
        </div>
        <div>
          <label htmlFor="ob-name">Full name</label>
          <input id="ob-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={40} autoFocus />
        </div>
        <div>
          <label htmlFor="ob-year">JEE attempt year</label>
          <select id="ob-year" className="select" style={{ width: "100%", height: 40 }} value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">Select</option>
            {[0, 1, 2].map((i) => <option key={i} value={thisYear + i}>{thisYear + i}</option>)}
          </select>
        </div>
        {error && <div className="notice notice-error">{error}</div>}
        <button className="btn btn-block btn-lg" disabled={busy}>{busy ? "Saving…" : "Continue"}</button>
      </form>
    </div>
  );
}

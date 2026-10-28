"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { updateProfile } from "@/lib/api";
import { useApp } from "./AppProvider";

// New accounts (phone/email sign-ups have no name) must pick a display name first.
export function Onboarding({ children }: { children: React.ReactNode }) {
  const { user, refresh } = useApp();
  const path = usePathname();
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!user || user.name || path.startsWith("/auth")) return <>{children}</>;

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
        <div className="center">
          <div style={{ fontSize: "2rem" }}>👋</div>
          <h2>One last thing</h2>
          <p className="muted small">This is how you&apos;ll appear on leaderboards.</p>
        </div>
        <div>
          <label htmlFor="ob-name">Your name</label>
          <input id="ob-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={40} autoFocus />
        </div>
        <div>
          <label htmlFor="ob-year">JEE attempt year</label>
          <select id="ob-year" className="select" style={{ width: "100%" }} value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">Select…</option>
            {[0, 1, 2].map((i) => <option key={i} value={thisYear + i}>{thisYear + i}</option>)}
          </select>
        </div>
        {error && <p className="small" style={{ color: "var(--red)" }}>{error}</p>}
        <button className="btn btn-block" disabled={busy}>{busy ? "Saving…" : "Let's go →"}</button>
      </form>
    </div>
  );
}

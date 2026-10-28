"use client";

import Link from "next/link";
import { useApp } from "./AppProvider";

export function ProGate({ title, children }: { title: string; children: React.ReactNode }) {
  const { user } = useApp();
  if (user?.plan === "pro") return <>{children}</>;
  return (
    <div className="locked card">
      <div className="locked-content">{children}</div>
      <div className="locked-overlay">
        <div>
          <div className="lock-icon">🔒</div>
          <h3>{title}</h3>
          <p className="muted small">Deep analysis is part of Tayyari Pro.</p>
          <Link href="/pricing" className="btn">Unlock with Pro</Link>
        </div>
      </div>
    </div>
  );
}

export function LoginPrompt({ message = "Log in to continue." }: { message?: string }) {
  return (
    <div className="container page">
      <div className="card center" style={{ maxWidth: 420, margin: "0 auto" }}>
        <h2>Log in required</h2>
        <p className="muted">{message}</p>
        <Link href="/login" className="btn">Log in</Link>
      </div>
    </div>
  );
}

export function Bar({ value, color }: { value: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return <div className="bar"><div style={{ width: `${pct}%`, background: color }} /></div>;
}

export function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return <div className="stat"><div className="v">{value}</div><div className="l">{label}</div></div>;
}

export const kindLabel = { full: "Full Mock", subject: "Subject-wise", chapter: "Chapter-wise" } as const;

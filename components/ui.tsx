"use client";

import { AlertCircle, CheckCircle2, Info, Lock } from "lucide-react";
import Link from "next/link";
import { useApp } from "./AppProvider";

export function PageHead({ title, sub, children }: { title: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="row">{children}</div>}
    </div>
  );
}

export function ProGate({ title, children }: { title: string; children: React.ReactNode }) {
  const { user } = useApp();
  if (user?.plan === "pro") return <>{children}</>;
  return (
    <div className="locked card">
      <div className="locked-content">{children}</div>
      <div className="locked-overlay">
        <div>
          <Lock size={20} strokeWidth={1.8} />
          <h3>{title}</h3>
          <p className="muted small" style={{ margin: "4px 0 14px" }}>Available with Tayyari Pro.</p>
          <Link href="/pricing" className="btn btn-sm">See Pro</Link>
        </div>
      </div>
    </div>
  );
}

export function LoginPrompt({ message = "Log in to continue." }: { message?: string }) {
  return (
    <div className="page page-narrow">
      <div className="card empty">
        <Lock size={28} strokeWidth={1.5} />
        <h3>Log in required</h3>
        <p className="small" style={{ marginBottom: 16 }}>{message}</p>
        <Link href="/login" className="btn">Log in</Link>
      </div>
    </div>
  );
}

export function Notice({ kind = "info", children }: { kind?: "info" | "warn" | "error" | "ok"; children: React.ReactNode }) {
  const Icon = kind === "ok" ? CheckCircle2 : kind === "info" ? Info : AlertCircle;
  return (
    <div className={`notice ${kind === "info" ? "" : `notice-${kind}`}`}>
      <Icon size={16} strokeWidth={2} />
      <div>{children}</div>
    </div>
  );
}

export function Bar({ value, color }: { value: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return <div className="bar"><div style={{ width: `${pct}%`, background: color }} /></div>;
}

export function Stats({ children }: { children: React.ReactNode }) {
  return <div className="stats">{children}</div>;
}

export function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return <div className="stat"><div className="l">{label}</div><div className="v">{value}</div></div>;
}

export function Loading() {
  return <div className="page muted small">Loading…</div>;
}

export const kindLabel = { full: "Full mock", subject: "Subject", chapter: "Chapter" } as const;

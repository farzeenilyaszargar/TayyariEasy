"use client";

import { AlertCircle, CheckCircle2, Crown, Info, Lock } from "lucide-react";
import Link from "next/link";
import { useApp } from "./AppProvider";

export function PageHead({ title, sub, children }: { title: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="page-head spread" style={{ alignItems: "flex-end" }}>
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
          <div className="pro-mini" style={{ display: "inline-flex", background: "#fff" }}>
            <span className="ic"><Lock size={18} /></span>
            <div style={{ textAlign: "left" }}>
              <h3>{title}</h3>
              <p className="muted xs">Unlock with Tayyari Pro</p>
            </div>
            <Link href="/pro" className="btn btn-purple btn-sm">Unlock</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small, quiet Pro prompt for profile / analytics / paper limits.
export function ProMini({ text }: { text: string }) {
  const { user } = useApp();
  if (user?.plan === "pro") return null;
  return (
    <Link href="/pro" className="pro-mini">
      <span className="ic"><Crown size={18} /></span>
      <span className="small" style={{ flex: 1, color: "var(--purple-dark)" }}>{text}</span>
      <span className="tag tag-pro">Pro</span>
    </Link>
  );
}

export function Notice({ kind = "blue", children }: { kind?: "blue" | "yellow" | "red" | "green"; children: React.ReactNode }) {
  const Icon = kind === "green" ? CheckCircle2 : kind === "blue" ? Info : AlertCircle;
  return <div className={`notice notice-${kind}`}><Icon size={20} /><div>{children}</div></div>;
}

export function Bar({ value, color }: { value: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return <div className="bar"><div style={{ width: `${pct}%`, background: color }} /></div>;
}

export function StatTile({ icon, color, value, label }: { icon: React.ReactNode; color: string; value: React.ReactNode; label: string }) {
  return (
    <div className="stat-tile">
      <span className="ic" style={{ background: color, color: "#fff" }}>{icon}</span>
      <div><div className="v">{value}</div><div className="l">{label}</div></div>
    </div>
  );
}

export function Loading() {
  return <div className="page muted">Loading…</div>;
}

export const kindLabel = { full: "Full mock", subject: "Subject", chapter: "Chapter", demo: "Warm-up" } as const;

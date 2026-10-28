"use client";

import { AlertCircle, CheckCircle2, ChevronRight, Info } from "lucide-react";
import Link from "next/link";
import { useApp } from "./AppProvider";
import { Icon3D, IconTile, type Icon3DName } from "./Icon3D";

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
        <div className="pro-mini" style={{ boxShadow: "var(--shadow-lg)" }}>
          <Icon3D name="lock" size={30} />
          <div style={{ textAlign: "left" }}>
            <h3>{title}</h3>
            <p className="muted xs">Included with Tayyari Pro</p>
          </div>
          <Link href="/pro" className="btn btn-purple btn-sm">Unlock</Link>
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
      <Icon3D name="crown" size={28} />
      <span className="small" style={{ flex: 1, fontWeight: 600 }}>{text}</span>
      <span className="tag tag-pro">Pro</span>
      <ChevronRight size={16} className="faint" />
    </Link>
  );
}

export function Notice({ kind = "blue", children }: { kind?: "blue" | "yellow" | "red" | "green"; children: React.ReactNode }) {
  const Icon = kind === "green" ? CheckCircle2 : kind === "blue" ? Info : AlertCircle;
  return <div className={`notice notice-${kind}`}><Icon size={18} /><div>{children}</div></div>;
}

export function Bar({ value, color }: { value: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return <div className="bar"><div style={{ width: `${pct}%`, background: color }} /></div>;
}

export function StatTile({ icon, tint = "var(--tint-indigo)", value, label }: { icon: Icon3DName; tint?: string; value: React.ReactNode; label: string }) {
  return (
    <div className="stat-tile">
      <IconTile name={icon} size={44} tint={tint} />
      <div><div className="v">{value}</div><div className="l">{label}</div></div>
    </div>
  );
}

export function Loading() {
  return <div className="page muted">Loading…</div>;
}

export const kindLabel = { full: "Full mock", subject: "Subject", chapter: "Chapter", demo: "Warm-up" } as const;

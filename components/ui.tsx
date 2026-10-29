"use client";

import { AlertCircle, CheckCircle2, ChevronRight, Info } from "lucide-react";
import Link from "next/link";
import { useApp } from "./AppProvider";
import { IconTile, type IconName } from "./Icon";

export function PageHead({ title, sub, children }: { title: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode }) {
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
          <IconTile name="lock" tint="var(--tint-slate)" size={40} />
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
      <IconTile name="crown" tint="var(--tint-violet)" size={36} />
      <span className="small" style={{ flex: 1, fontWeight: 600 }}>{text}</span>
      <span className="tag tag-pro">Pro</span>
      <ChevronRight size={16} className="faint" />
    </Link>
  );
}

// Apple-style segmented control with a sliding thumb.
export function Segmented<T extends string>({ options, value, onChange }: { options: { key: T; label: React.ReactNode }[]; value: T; onChange: (v: T) => void }) {
  const i = Math.max(0, options.findIndex((o) => o.key === value));
  return (
    <div className="segmented" role="tablist">
      <span className="thumb" style={{ width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${i * 100}%)` }} />
      {options.map((o) => (
        <button key={o.key} role="tab" aria-selected={o.key === value} className={o.key === value ? "on" : ""} onClick={() => onChange(o.key)}>{o.label}</button>
      ))}
    </div>
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

export function StatTile({ icon, tint = "var(--tint-indigo)", value, label, solid }: { icon: IconName; tint?: string; value: React.ReactNode; label: string; solid?: boolean }) {
  return (
    <div className={`stat-tile ${solid ? "solid" : ""}`}>
      <IconTile name={icon} size={44} tint={tint} />
      <div><div className="v">{value}</div><div className="l">{label}</div></div>
    </div>
  );
}

// Circular spinner; `full` centres it in the viewport for page-level loads.
export function Spinner({ size = 28 }: { size?: number }) {
  return <span className="spinner" style={{ width: size, height: size }} role="status" aria-label="Loading" />;
}

export function Loading({ full = true }: { full?: boolean }) {
  return <div className={full ? "loading-screen" : "loading-inline"}><Spinner size={full ? 34 : 26} /></div>;
}

export const kindLabel = { full: "Full mock", subject: "Subject", chapter: "Chapter", demo: "Warm-up" } as const;

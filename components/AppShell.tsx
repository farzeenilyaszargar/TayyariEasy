"use client";

import { Award, BarChart3, ClipboardList, Gem, LayoutDashboard, LogIn, LogOut, Menu, Trophy, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "./AppProvider";
import { Onboarding } from "./Onboarding";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tests", label: "Tests", icon: ClipboardList },
  { href: "/results", label: "Results", icon: BarChart3 },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/badges", label: "Badges", icon: Award },
];

// Routes that take the full screen (no sidebar).
const BARE = [/^\/login/, /^\/auth/, /\/attempt$/];

export function Brand() {
  return (
    <Link href="/" className="brand">
      <span className="brand-mark">t</span>tayyari
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useApp();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  if (BARE.some((r) => r.test(path))) return <>{children}</>;
  if (user && !user.name) return <Onboarding />;

  const active = (href: string) => path === href || path.startsWith(href + "/");

  return (
    <div className={`shell ${open ? "open" : ""}`}>
      <aside className="sidebar">
        <Brand />
        <nav>
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`side-link ${active(href) ? "active" : ""}`}>
              <Icon size={17} strokeWidth={1.8} />{label}
            </Link>
          ))}
          <div className="side-section">Account</div>
          <Link href="/pricing" className={`side-link ${active("/pricing") ? "active" : ""}`}>
            <Gem size={17} strokeWidth={1.8} />{user?.plan === "pro" ? "Your plan" : "Upgrade to Pro"}
          </Link>
        </nav>

        <div className="side-foot">
          {user ? (
            <>
              <div className="side-user">
                <span className="avatar">{(user.name ?? "S").charAt(0).toUpperCase()}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="name">{user.name}</div>
                  <div className="xs muted num">
                    {user.plan === "pro" ? "Pro" : "Free"} · {user.points} pts
                  </div>
                </div>
              </div>
              <button className="side-link btn-ghost" style={{ width: "100%", border: 0, cursor: "pointer" }} onClick={logout}>
                <LogOut size={17} strokeWidth={1.8} />Log out
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-block"><LogIn size={16} />Log in</Link>
          )}
        </div>
      </aside>
      <div className="scrim" onClick={() => setOpen(false)} />

      <div className="content">
        <header className="topbar">
          <Brand />
          <button className="icon-btn" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

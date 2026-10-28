"use client";

import { BarChart3, ChevronDown, Crown, Flame, LogOut, Trophy, User, Zap, FileText } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { streakDays } from "@/lib/quota";
import { useApp } from "./AppProvider";
import { Avatar } from "./Avatar";

const PUBLIC = [/^\/$/, /^\/login/, /^\/auth/];
const FOCUS = [/^\/welcome/, /\/attempt$/, /^\/complete\//]; // full-screen, no navbar
const ONBOARDING_OK = [/^\/welcome/, /^\/papers\/demo\/attempt$/, /^\/complete\//];

export function Logo() {
  return <Link href="/" className="logo">tayyari</Link>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useApp();
  const path = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC.some((r) => r.test(path));
  const needsOnboarding = !!user && (!user.name || !user.onboarded);

  useEffect(() => {
    if (!ready) return;
    if (!user && !isPublic) router.replace(`/login?next=${encodeURIComponent(path)}`);
    else if (needsOnboarding && !ONBOARDING_OK.some((r) => r.test(path))) router.replace("/welcome");
    else if (user && !needsOnboarding && (path === "/" || path === "/welcome")) router.replace("/papers");
  }, [ready, user, isPublic, needsOnboarding, path, router]);

  if (isPublic) return <>{children}</>;
  if (!ready || !user) return <div className="page muted">Loading…</div>;
  if (FOCUS.some((r) => r.test(path))) return <>{children}</>;
  return (
    <>
      <TopNav />
      <main>{children}</main>
    </>
  );
}

function TopNav() {
  const { user, attempts, logout } = useApp();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  if (!user) return null;
  const streak = streakDays(attempts);
  const on = (p: string) => path === p || path.startsWith(p + "/");

  return (
    <header className="nav">
      <div className="nav-inner">
        <Logo />
        <nav className="nav-links">
          <Link href="/papers" className={`nav-link ${on("/papers") ? "active" : ""}`}><FileText size={20} /><span>Papers</span></Link>
        </nav>
        <div className="nav-right">
          <span className={`pill-stat streak ${streak ? "" : "off"}`} title={`${streak}-day streak`}><Flame size={22} fill="currentColor" />{streak}</span>
          <span className="pill-stat points" title="Points"><Zap size={22} fill="currentColor" />{user.points}</span>
          <Link href="/leaderboard" className={`nav-link ${on("/leaderboard") ? "active" : ""}`}><Trophy size={20} /><span>Leaderboard</span></Link>
          <div ref={ref} style={{ position: "relative" }}>
            <button className="profile-btn" onClick={() => setOpen(!open)} aria-label="Profile menu">
              <Avatar name={user.name} url={user.avatarUrl} color={user.avatarColor} size={34} />
              <span className="name">{(user.name ?? "").split(" ")[0]}</span>
              <ChevronDown size={16} />
            </button>
            {open && (
              <div className="menu">
                <Link href="/profile"><User size={18} />Profile</Link>
                <Link href="/analytics"><BarChart3 size={18} />Dashboard &amp; analytics</Link>
                {user.plan !== "pro" && <Link href="/pro" style={{ color: "var(--purple-dark)" }}><Crown size={18} />Upgrade to Pro</Link>}
                <hr />
                <button onClick={logout}><LogOut size={18} />Log out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

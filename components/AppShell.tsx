"use client";

import { BarChart3, Crown, Flame, LogOut, Trophy, User, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { streakDays } from "@/lib/quota";
import { useApp } from "./AppProvider";
import { Avatar } from "./Avatar";
import { Mark } from "./Mark";
import { Loading } from "./ui";

const PUBLIC = [/^\/$/, /^\/login/, /^\/auth/];
const FOCUS = [/^\/welcome/, /\/attempt$/, /^\/complete\//]; // full-screen, no navbar
const ONBOARDING_OK = [/^\/welcome/, /^\/papers\/demo\/attempt$/, /^\/complete\//];

// Signed-in students land on Papers, so the logo takes them there.
export function Logo() {
  const { user } = useApp();
  return <Link href={user ? "/papers" : "/"} className="logo"><Mark size={26} className="logo-mark" />tayyari</Link>;
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
  if (!ready || !user) return <Loading />;
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
        <div className="nav-right">
          <span className={`pill-stat tip streak ${streak ? "" : "off"}`} tabIndex={0}
            aria-label={`${streak}-day streak`}
            data-tip={streak ? `${streak}-day streak · finish a paper every day to keep it going` : "Streak · finish a paper today to start one"}>
            <Flame size={18} strokeWidth={1.8} fill={streak ? "currentColor" : "none"} />{streak}
          </span>
          <span className="pill-stat tip points" tabIndex={0}
            aria-label={`${user.points} points`}
            data-tip={`${user.points} points · earned from papers and badges`}>
            <Zap size={18} strokeWidth={1.8} />{user.points}
          </span>
          <Link href="/leaderboard" className={`nav-link ${on("/leaderboard") ? "active" : ""}`}><Trophy size={18} /><span>Leaderboard</span></Link>
          <div ref={ref} style={{ position: "relative" }}>
            <button className="profile-btn" onClick={() => setOpen(!open)} aria-label="Profile menu" aria-expanded={open}>
              <Avatar name={user.name} url={user.avatarUrl} color={user.avatarColor} size={40} />
            </button>
            {open && (
              <div className="menu">
                <div className="menu-head">
                  <Avatar name={user.name} url={user.avatarUrl} color={user.avatarColor} size={36} />
                  <div style={{ minWidth: 0 }}>
                    <div className="menu-name">{user.name}</div>
                    <div className="xs muted">{user.plan === "pro" ? "Pro plan" : "Free plan"} · {user.points} pts</div>
                  </div>
                </div>
                <hr />
                <Link href="/profile"><User size={18} />Profile</Link>
                <Link href="/analytics"><BarChart3 size={18} />Dashboard &amp; analytics</Link>
                {user.plan !== "pro" && <Link href="/pro"><Crown size={18} />Upgrade to Pro</Link>}
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

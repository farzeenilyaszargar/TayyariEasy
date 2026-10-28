"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppProvider";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tests", label: "Tests" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/badges", label: "Badges" },
  { href: "/pricing", label: "Pricing" },
];

export function Logo() {
  return (
    <Link href="/" className="logo">
      <span className="logo-mark">त</span>tayyari<span className="dot">.</span>
    </Link>
  );
}

export function Nav() {
  const { user } = useApp();
  const path = usePathname();
  // The exam screen is full-focus; no nav while attempting.
  if (path.endsWith("/attempt")) return null;

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Logo />
        <nav className="nav-links">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={path.startsWith(l.href) ? "active" : ""}>{l.label}</Link>
          ))}
        </nav>
        <div className="nav-user">
          {user ? (
            <Link href="/dashboard" className="user-pill">
              <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
              {user.name.split(" ")[0]}
              {user.plan === "pro" && <span className="pro-tag">PRO</span>}
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link href="/login" className="btn btn-sm">Start free</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

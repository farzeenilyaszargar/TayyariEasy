"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { BookIcon, ChatIcon, FlaskIcon, HomeIcon, TrophyIcon } from "@/components/ui-icons";

const links = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/tests", label: "Tests", icon: FlaskIcon },
  { href: "/problems", label: "Doubts", icon: ChatIcon },
  { href: "/leaderboards", label: "Leaderboards", icon: TrophyIcon },
  { href: "/resources", label: "Resources", icon: BookIcon }
];

export function Navbar() {
  const pathname = usePathname();
  const { isLoggedIn, login, logout, user } = useAuth();

  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Link href="/" className="brand">
          <span className="brand-main">Tayyari</span>
          <span className="brand-chip">JEE</span>
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${isActive ? "active" : ""}`}
              >
                <span className="nav-icon">
                  <Icon size={16} />
                </span>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="nav-right">
          {isLoggedIn ? <span className="pill">{user.points} pts</span> : null}
          <button className={`btn ${isLoggedIn ? "btn-outline" : "btn-solid"}`} onClick={isLoggedIn ? logout : login}>
            {isLoggedIn ? "Logout" : "Login"}
          </button>
        </div>
      </div>
    </header>
  );
}

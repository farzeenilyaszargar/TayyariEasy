"use client";

import Image from "next/image";
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

  if (pathname.startsWith("/tests/mock")) {
    return null;
  }

  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Link href="/" className="brand">
          <Image src="/logo.png" alt="Tayyari logo" width={35} height={35} className="brand-logo" priority />
          <span className="brand-main">Tayyari</span>
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
          {isLoggedIn && user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="nav-avatar" referrerPolicy="no-referrer" />
          ) : null}
          {isLoggedIn ? <span className="pill">{user.points} pts</span> : null}
          <button className={`btn ${isLoggedIn ? "btn-outline" : "btn-solid"}`} onClick={isLoggedIn ? logout : login}>
            {isLoggedIn ? "Logout" : "Login"}
          </button>
        </div>
      </div>
    </header>
  );
}

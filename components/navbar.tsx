"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  BookIcon,
  ChatIcon,
  ChevronDownIcon,
  FlaskIcon,
  HomeIcon,
  MoonIcon,
  TrophyIcon,
  UserIcon
} from "@/components/ui-icons";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const pointsLabel = new Intl.NumberFormat("en-IN").format(user.points);

  if (pathname.startsWith("/tests/mock")) {
    return null;
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const savedTheme = window.localStorage.getItem("tayyari-theme");
    const nextTheme = savedTheme === "dark" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("tayyari-theme", nextTheme);
    }
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

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
          {isLoggedIn ? <span className="pill">{pointsLabel} pts</span> : null}
          {isLoggedIn ? (
            <div className="profile-menu" ref={menuRef}>
              <button
                className="profile-menu-trigger"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Open profile menu"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="nav-avatar" referrerPolicy="no-referrer" />
                ) : (
                  <span className="nav-avatar nav-avatar-fallback">
                    <UserIcon size={16} />
                  </span>
                )}
                <ChevronDownIcon size={14} />
              </button>

              {menuOpen ? (
                <div className="profile-menu-dropdown" role="menu" aria-label="Profile menu">
                  <button
                    className="profile-menu-item"
                    role="menuitem"
                    onClick={() => {
                      toggleTheme();
                      setMenuOpen(false);
                    }}
                  >
                    <MoonIcon size={15} />
                    Toggle theme
                  </button>
                  <button
                    className="profile-menu-item"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      void logout();
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <button className="btn btn-solid" onClick={login}>
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

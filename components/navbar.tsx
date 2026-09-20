"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, HomeIcon, LogOutIcon, SettingsIcon, UserIcon } from "@/components/ui-icons";
import { useAuth } from "@/components/auth-provider";
import { AccountEntryLink } from "@/components/account-entry-link";

export function Navbar() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const resourcesRef = useRef<HTMLDivElement | null>(null);
  const { isLoggedIn, user, logout } = useAuth();

  useEffect(() => {
    const closeProfile = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (!resourcesRef.current?.contains(event.target as Node)) {
        setResourcesOpen(false);
      }
    };
    document.addEventListener("mousedown", closeProfile);
    return () => document.removeEventListener("mousedown", closeProfile);
  }, []);

  if (pathname.startsWith("/tests/mock")) {
    return null;
  }

  const isMainApp = pathname === "/home" || pathname === "/leaderboards" || pathname.startsWith("/tests") || pathname.startsWith("/resources") || pathname === "/pricings";

  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Link href="/" className="brand" aria-label="Tayyari home">
          <Image src="/tayyari-logo.png" alt="Tayyari logo" width={46} height={46} className="brand-logo" priority />
        </Link>
        {isMainApp && isLoggedIn ? (
          <div className="nav-right">
            <nav className="nav-links" aria-label="Main app links">
              <Link href="/tests" className={`nav-link ${pathname.startsWith("/tests") ? "active" : ""}`}>
                Tests
              </Link>
              <Link href="/leaderboards" className={`nav-link ${pathname === "/leaderboards" ? "active" : ""}`}>
                Leaderboards
              </Link>
              <Link href="/pricings" className={`nav-link ${pathname === "/pricings" ? "active" : ""}`}>Pricing</Link>
              <div className="resource-nav-menu" ref={resourcesRef}>
                <button
                  type="button"
                  className={`nav-link resource-nav-trigger ${pathname.startsWith("/resources") ? "active" : ""}`}
                  onClick={() => setResourcesOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={resourcesOpen}
                >
                  Resources <ChevronDownIcon size={14} className={resourcesOpen ? "resource-nav-chevron is-open" : "resource-nav-chevron"} aria-hidden="true" />
                </button>
                {resourcesOpen ? (
                  <div className="resource-nav-dropdown" role="menu" aria-label="Resources">
                    <Link href="/resources/articles" className="resource-nav-item" role="menuitem" onClick={() => setResourcesOpen(false)}>
                      <strong>Articles</strong><small>Guides and strategies</small>
                    </Link>
                    <Link href="/resources/pyqs" className="resource-nav-item" role="menuitem" onClick={() => setResourcesOpen(false)}>
                      <strong>PYQs</strong><small>Previous year questions</small>
                    </Link>
                    <Link href="/resources/free-books" className="resource-nav-item" role="menuitem" onClick={() => setResourcesOpen(false)}>
                      <strong>Free Books</strong><small>Curated study material</small>
                    </Link>
                  </div>
                ) : null}
              </div>
            </nav>
            <div className="profile-menu" ref={profileRef}>
              {isLoggedIn ? <><button className="profile-menu-trigger mock-profile-button" onClick={() => setProfileOpen((open) => !open)} aria-haspopup="menu" aria-expanded={profileOpen} aria-label={`${user.name} profile menu`}>
                {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="nav-profile-avatar" /> : <UserIcon size={18} />}
              </button>
              {profileOpen ? (
                <div className="profile-menu-dropdown" role="menu" aria-label="Profile menu">
                  <Link href="/home" className="profile-menu-item" role="menuitem" onClick={() => setProfileOpen(false)}>
                    <HomeIcon size={16} />
                    Dashboard
                  </Link>
                  <button className="profile-menu-item" role="menuitem" onClick={() => setProfileOpen(false)}>
                    <SettingsIcon size={16} />
                    Settings
                  </button>
                  <button className="profile-menu-item logout-menu-item" role="menuitem" onClick={() => { setProfileOpen(false); void logout(); }}>
                    <LogOutIcon size={16} />
                    Logout
                  </button>
                </div>
              ) : null}</> : <Link href={`/auth?next=${encodeURIComponent(pathname)}`} className="nav-signin">Sign in</Link>}
            </div>
          </div>
        ) : pathname === "/" ? <AccountEntryLink className="nav-signin landing-header-signin" /> : null}
      </div>
    </header>
  );
}

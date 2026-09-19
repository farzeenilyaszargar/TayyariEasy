"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HomeIcon, LogOutIcon, SettingsIcon, UserIcon } from "@/components/ui-icons";

export function Navbar() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const closeProfile = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", closeProfile);
    return () => document.removeEventListener("mousedown", closeProfile);
  }, []);

  if (pathname.startsWith("/tests/mock")) {
    return null;
  }

  const isMainApp = pathname === "/home" || pathname === "/leaderboards" || pathname.startsWith("/tests") || pathname.startsWith("/resources");

  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Link href="/" className="brand" aria-label="Tayyari home">
          <Image src="/tayyari-logo.png" alt="Tayyari logo" width={46} height={46} className="brand-logo" priority />
        </Link>
        {isMainApp ? (
          <div className="nav-right">
            <nav className="nav-links" aria-label="Main app links">
              <Link href="/leaderboards" className={`nav-link ${pathname === "/leaderboards" ? "active" : ""}`}>
                Leaderboards
              </Link>
              <Link href="/resources" className={`nav-link ${pathname.startsWith("/resources") ? "active" : ""}`}>
                Resources
              </Link>
            </nav>
            <div className="profile-menu" ref={profileRef}>
              <button
                className="profile-menu-trigger mock-profile-button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                <UserIcon size={18} />
              </button>
              {profileOpen ? (
                <div className="profile-menu-dropdown" role="menu" aria-label="Profile menu">
                  <Link href="/home" className="profile-menu-item" role="menuitem" onClick={() => setProfileOpen(false)}>
                    <HomeIcon size={16} />
                    Dashboard
                  </Link>
                  <button className="profile-menu-item logout-menu-item" role="menuitem" onClick={() => setProfileOpen(false)}>
                    <SettingsIcon size={16} />
                    Settings
                  </button>
                  <button className="profile-menu-item" role="menuitem" onClick={() => setProfileOpen(false)}>
                    <LogOutIcon size={16} />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}

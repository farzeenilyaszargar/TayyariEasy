"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { LockedLeaderboard } from "@/components/locked-leaderboard";

export function SiteAccess({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isReady, isLoggedIn } = useAuth();
  if (pathname === "/" || pathname === "/demo" || pathname === "/auth" || pathname === "/pricings") return <>{children}</>;
  if (!isReady) return <div className="access-loading" aria-label="Loading account" />;
  if (!isLoggedIn) return <LockedLeaderboard />;
  return <>{children}</>;
}

"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export function SiteAccess({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isReady, isLoggedIn } = useAuth();
  if (pathname === "/" || pathname === "/auth" || pathname === "/pricings" || pathname === "/privacy-policy" || pathname === "/terms-of-service" || (pathname === "/tests/mock" && searchParams.get("demo") === "1")) return <>{children}</>;
  if (!isReady) return <div className="access-loading" aria-label="Loading account" />;
  if (!isLoggedIn) return (
    <div className="access-gate">
      <div className="access-locked-content" aria-hidden="true">{children}</div>
      <div className="access-lock-overlay">
        <div className="access-lock-panel" role="dialog" aria-modal="true" aria-labelledby="access-lock-title">
          <span className="demo-kicker">Your next chapter starts here</span>
          <h1 id="access-lock-title">See where you can go.</h1>
          <p>Sign in to unlock JEE mock tests, leaderboards, resources, and your progress dashboard.</p>
          <Link href={`/auth?next=${encodeURIComponent(pathname)}`} className="btn btn-solid">Sign in to unlock JEE mock tests</Link>
          <small>One free full mock every week · no payment required</small>
        </div>
      </div>
    </div>
  );
  return <>{children}</>;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { InstagramIcon, XIcon, YouTubeIcon } from "@/components/ui-icons";

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname === "/problems") {
    return null;
  }

  return (
    <footer className="site-footer">
      <div className="container site-footer-wrap">
        <div className="footer-brand">
          <h3>Tayyari</h3>
          <p className="muted">JEE rank prediction, test practice, and focused analytics in one platform.</p>
          <div className="footer-socials" aria-label="Social links">
            <a href="#" className="social-icon" aria-label="X">
              <XIcon size={14} />
            </a>
            <a href="#" className="social-icon" aria-label="YouTube">
              <YouTubeIcon size={14} />
            </a>
            <a href="#" className="social-icon" aria-label="Instagram">
              <InstagramIcon size={14} />
            </a>
          </div>
        </div>
        <div className="footer-links">
          <h4>Platform</h4>
          <Link href="/tests">Tests</Link>
          <Link href="/resources">Resources</Link>
          <Link href="/leaderboards">Leaderboards</Link>
        </div>
        <div className="footer-links">
          <h4>Legal</h4>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact Support</a>
        </div>
      </div>
    </footer>
  );
}

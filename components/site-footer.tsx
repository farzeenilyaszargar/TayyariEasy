"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  if (pathname === "/problems" || pathname === "/login" || pathname.startsWith("/tests/mock")) {
    return null;
  }

  return (
    <footer className="site-footer">
      <div className="container site-footer-wrap">
        <div className="footer-brand">
          <h3>Tayyari</h3>
          <p className="muted">JEE rank prediction, test practice, and focused analytics in one platform.</p>
          <div className="footer-socials" aria-label="Social links">
            <a
              href="https://www.youtube.com/@nap-tui"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon"
              aria-label="YouTube"
            >
              <Image src="/youtube.png" alt="" width={18} height={18} className="social-icon-img" />
            </a>
            <a
              href="https://www.instagram.com/tayyari.karo/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon"
              aria-label="Instagram"
            >
              <Image src="/insta.png" alt="" width={18} height={18} className="social-icon-img" />
            </a>
          </div>
        </div>
        <div className="footer-links">
          <h4>Platform</h4>
          <Link href="/tests">Tests</Link>
          <Link href="/problems">Doubts</Link>
          <Link href="/resources">Resources</Link>
          <Link href="/leaderboards">Leaderboards</Link>
        </div>
        <div className="footer-links">
          <h4>Legal</h4>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/terms-of-service">Terms of Service</Link>
          <a href="#">Contact Support</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <small>© {currentYear} Nap Org. All rights reserved.</small>
      </div>
    </footer>
  );
}

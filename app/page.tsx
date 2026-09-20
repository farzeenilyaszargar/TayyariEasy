import Image from "next/image";
import Link from "next/link";
import { TrustBadge } from "@/components/trust-badge";
import { ArrowRightIcon } from "@/components/ui-icons";
import { AccountEntryLink } from "@/components/account-entry-link";

export default function Page() {
  return (
    <section className="landing-page">
      <div className="landing-layout">
        <div className="landing-copy">
          <TrustBadge />
          <h1>Practice smarter. Walk into JEE ready.</h1>
          <p>Practice for JEE Main and JEE Advanced with focused tests, honest score feedback, and a clear next step.</p>
          <div className="hero-actions">
            <Link href="/tests/mock?demo=1" className="btn btn-solid main-app-button hero-cta">
              Give a mock test now
              <ArrowRightIcon size={18} className="hero-cta-arrow" />
            </Link>
            <AccountEntryLink className="btn btn-outline hero-signin" />
          </div>
        </div>
        <div className="hero-test-preview">
          <Image
            src="/jee-test-preview.png"
            alt="Tayyari JEE mock test interface preview"
            width={2592}
            height={1494}
            priority
          />
        </div>
      </div>
      <section className="landing-purpose" aria-labelledby="landing-purpose-title">
        <span className="demo-kicker">Built for serious JEE preparation</span>
        <h2 id="landing-purpose-title">A focused place to practise, measure, and improve.</h2>
        <p>
          Tayyari is a JEE Main and JEE Advanced preparation platform. Students use realistic mock tests to practise
          under time pressure, review subject-wise performance, and turn every attempt into a clearer revision plan.
        </p>
        <div className="landing-purpose-points">
          <span>JEE mock tests</span><span>Score and accuracy analysis</span><span>Progress and leaderboards</span>
        </div>
      </section>
    </section>
  );
}

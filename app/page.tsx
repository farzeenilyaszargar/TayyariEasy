import Link from "next/link";

export default function Page() {
  return (
    <section className="landing-page">
      <div className="landing-layout">
        <div className="landing-copy">
          <div className="trust-badge"><span>+3,642</span> Students Using Tayyari</div>
          <h1>Do you prep, or do you just study?</h1>
          <p>Build a sharper preparation routine with focused practice, honest progress, and a clear next step.</p>
          <Link href="/tests" className="btn btn-solid main-app-button">
            Main app
          </Link>
        </div>
        <div className="hero-demo-placeholder" aria-label="Demo video placeholder" />
      </div>
    </section>
  );
}

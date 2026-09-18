import Link from "next/link";

export default function Page() {
  return (
    <section className="landing-page">
      <div className="landing-layout">
        <div className="landing-copy">
          <div className="trust-badge"><span>+3,642</span> Students Using Tayyari</div>
          <h1>JEE mock tests that make your preparation clearer.</h1>
          <p>Practice for JEE Main and JEE Advanced with focused tests, honest score feedback, and a clear next step.</p>
          <Link href="/tests" className="btn btn-solid main-app-button">
            Main app
          </Link>
        </div>
        <div className="hero-demo-placeholder" aria-label="Demo video placeholder" />
      </div>
    </section>
  );
}

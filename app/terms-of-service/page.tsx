import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Tayyari",
  description: "Terms of Service for Tayyari platform."
};

export default function TermsOfServicePage() {
  return (
    <section className="page">
      <article className="card">
        <h1>Terms of Service</h1>
        <p className="muted">Last updated: March 2, 2026</p>
        <p>
          By using Tayyari, you agree to use the platform responsibly for exam preparation. You must provide accurate
          account information and follow applicable laws while accessing the service.
        </p>

        <h2>Acceptable Use</h2>
        <ul className="resource-article-list">
          <li>Do not misuse the platform, automate abuse, or attempt unauthorized access.</li>
          <li>Do not upload harmful content, malicious code, or misleading exam claims.</li>
          <li>Respect intellectual property and third-party content rights.</li>
        </ul>

        <h2>Account Responsibilities</h2>
        <ul className="resource-article-list">
          <li>You are responsible for account credentials and activities under your account.</li>
          <li>You should keep profile and authentication details secure and up to date.</li>
        </ul>

        <h2>Service Availability</h2>
        <p>
          We continuously improve Tayyari, but do not guarantee uninterrupted availability. Features may change, be
          updated, or removed to maintain quality, compliance, and reliability.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          Tayyari provides educational guidance and analytics support. Forecasts, rank estimates, and AI suggestions are
          indicative and not guaranteed outcomes for official exam results.
        </p>

        <h2>Termination</h2>
        <p>
          We may suspend accounts for policy violations, abuse, or security risks. You may stop using the service at any
          time.
        </p>

        <h2>Contact</h2>
        <p>For terms-related questions, contact support through official Tayyari channels.</p>
      </article>
    </section>
  );
}


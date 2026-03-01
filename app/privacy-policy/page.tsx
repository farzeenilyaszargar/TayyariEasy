import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Tayyari",
  description: "Privacy Policy for Tayyari platform."
};

export default function PrivacyPolicyPage() {
  return (
    <section className="page">
      <article className="card">
        <h1>Privacy Policy</h1>
        <p className="muted">Last updated: March 2, 2026</p>
        <p>
          Tayyari collects limited account and usage data required to provide test practice, analytics, and leaderboard
          features. We only use data to improve learning experience, platform reliability, and core product operations.
        </p>

        <h2>Information We Collect</h2>
        <ul className="resource-article-list">
          <li>Account details such as name, email/phone, and profile image from authentication providers.</li>
          <li>Test activity such as attempts, scores, accuracy, and timestamps.</li>
          <li>Optional profile fields such as target exam and target college.</li>
        </ul>

        <h2>How We Use Data</h2>
        <ul className="resource-article-list">
          <li>To generate performance analytics and personalized preparation insights.</li>
          <li>To maintain leaderboard ranking and points/badge progression.</li>
          <li>To prevent abuse, debug issues, and secure platform access.</li>
        </ul>

        <h2>Data Sharing</h2>
        <p>
          We do not sell personal data. We may share limited data with infrastructure providers strictly required to
          operate authentication, storage, analytics, and hosting services.
        </p>

        <h2>Your Controls</h2>
        <ul className="resource-article-list">
          <li>You can update profile details from your dashboard.</li>
          <li>You may request account data deletion by contacting support.</li>
          <li>You can stop using the platform at any time.</li>
        </ul>

        <h2>Contact</h2>
        <p>
          For privacy-related requests, contact support through the footer contact link or official Tayyari channels.
        </p>
      </article>
    </section>
  );
}


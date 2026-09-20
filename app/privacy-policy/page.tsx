import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Tayyari",
  description: "How Tayyari collects, uses, stores, and protects account, test, payment, and Google sign-in data."
};

export default function PrivacyPolicyPage() {
  return (
    <section className="page">
      <article className="card">
        <h1>Privacy Policy</h1>
        <p className="muted">Last updated: September 21, 2026</p>
        <p>
          This Privacy Policy explains how Tayyari (“Tayyari”, “we”, “us”, or “our”) collects and uses information when
          you visit tayyari.online, create an account, sign in with Google, attempt a test, use our resources, or buy
          Tayyari Pro. Tayyari is an online preparation platform for students preparing for JEE Main and JEE Advanced.
        </p>

        <h2>Information we collect</h2>
        <ul className="resource-article-list">
          <li><strong>Account information:</strong> name, email address, profile image, and a provider user ID. If you use Google sign-in, Google shares the identity information permitted by the sign-in flow; we do not receive your Google password.</li>
          <li><strong>Learning activity:</strong> questions viewed, answers, test attempts, scores, accuracy, time taken, subject performance, streaks, points, badges, and leaderboard activity.</li>
          <li><strong>Profile information:</strong> optional details such as target exam, target year, target college, and preferences that you choose to provide.</li>
          <li><strong>Payment information:</strong> Razorpay may process payment and billing details. Tayyari stores payment references, order IDs, payment status, and plan status, but does not store your full card number, CVV, or UPI PIN.</li>
          <li><strong>Device and technical information:</strong> browser, device, IP address, approximate location derived from IP, error logs, and security events when needed to operate and protect the service.</li>
          <li><strong>Local storage:</strong> your browser may store a sign-in session, test preferences, demo progress, and locally saved result information so the product works correctly.</li>
        </ul>

        <h2>How we use information</h2>
        <ul className="resource-article-list">
          <li>To create and secure your account, including Google OAuth authentication and account recovery.</li>
          <li>To deliver JEE mock tests, record answers, calculate scores, and show result analysis.</li>
          <li>To generate subject-level insights, progress summaries, points, badges, and leaderboards.</li>
          <li>To process Pro purchases, confirm payment, provide lifetime access, and prevent payment fraud.</li>
          <li>To respond to support requests, diagnose errors, improve reliability, and prevent abuse or unauthorized access.</li>
          <li>To send essential service messages such as sign-in, email confirmation, security, payment, and account notices. We do not sell your personal information or use it for unrelated advertising.</li>
        </ul>

        <h2>Services that process information</h2>
        <p>
          We share only the information necessary to run Tayyari with service providers acting on our instructions. These
          may include Supabase for authentication and database hosting, Google for Google sign-in, Razorpay for payments,
          and our hosting, security, email, and monitoring providers. These providers may process information in other
          countries and must protect it under their own privacy terms and our service agreements. We may also disclose
          information when required by law, to protect users, or to investigate fraud and security incidents.
        </p>

        <h2>Public profiles and leaderboards</h2>
        <p>If you use leaderboard or community features, your chosen display name, avatar, points, streak, score, or test count may be visible to other Tayyari users. You should avoid entering sensitive personal information in your profile name or any free-text field. We do not intentionally make your email address public.</p>

        <h2>Retention and security</h2>
        <p>We retain account and test information while your account is active and for as long as reasonably necessary to provide the service, resolve disputes, meet legal or accounting requirements, and maintain security records. After an approved deletion request, we delete or anonymize information within a reasonable period, except for information we must retain by law or legitimate security and fraud-prevention needs. We use access controls, encrypted connections, and provider security features, but no online service can guarantee absolute security.</p>

        <h2>Your choices and rights</h2>
        <ul className="resource-article-list">
          <li>You can update optional profile details from your dashboard.</li>
          <li>You can request access, correction, export, or deletion of your account information.</li>
          <li>You can clear browser storage or stop using the service at any time. Clearing storage may sign you out and remove local-only preferences.</li>
          <li>You can withdraw Google sign-in access from your Google Account settings; this does not automatically delete your Tayyari account, so contact us for deletion.</li>
        </ul>

        <h2>Children’s privacy</h2>
        <p>Tayyari is intended for exam aspirants and is not designed for children under 13. If you believe a child has provided personal information to us, contact us so we can review and remove it where appropriate.</p>

        <h2>Changes to this policy</h2>
        <p>We may update this policy when our product, providers, or legal obligations change. The “Last updated” date at the top indicates the latest version. Material changes will be communicated through the service when practical.</p>

        <h2>Contact us</h2>
        <p>
          For privacy questions or requests, email <a href="mailto:privacy@tayyari.online">privacy@tayyari.online</a> and include the email address associated with your Tayyari account.
        </p>
      </article>
    </section>
  );
}

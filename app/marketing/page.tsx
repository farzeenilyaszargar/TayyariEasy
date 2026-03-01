import Link from "next/link";
import { AwardIcon, BrainIcon, FlaskIcon, TargetIcon, TrendIcon } from "@/components/ui-icons";
import { ReviewSlider } from "@/components/review-slider";

const features = [
  {
    icon: TrendIcon,
    title: "Rank and Score Forecasting",
    detail: "Predict all India rank and likely score ranges from your latest performance data.",
    imageLight: "/f1-light.png",
    imageDark: "/f1-dark.png",
    bullets: ["Dynamic rank band updates", "Trend-based score confidence", "Subject-level impact modeling"]
  },
  {
    icon: FlaskIcon,
    title: "Topic + Full Syllabus Tests",
    detail: "Shift between precise topic drills and realistic exam-mode full mocks.",
    imageLight: "/f2-light.png",
    imageDark: "/f2-dark.png",
    bullets: ["Adaptive chapter drills", "Exam-like timing and pressure", "Post-test accuracy split"]
  },
  {
    icon: BrainIcon,
    title: "AI-Powered Improvement Loop",
    detail: "Get weakness detection, strategy suggestions, and confidence-based recommendations.",
    imageLight: "/f3-light.png",
    imageDark: "/f3-dark.png",
    bullets: ["Error pattern detection", "Attempt-order suggestions", "Revision priority list"]
  },
  {
    icon: AwardIcon,
    title: "Professional Gamification",
    detail: "Stay motivated with points, achievement badges, and leaderboard tracking.",
    imageLight: "/f1-light.png",
    imageDark: "/f1-dark.png",
    bullets: ["Merit-based badges", "Consistency points", "Competitive but focused environment"]
  }
];

const reviews = [
  {
    name: "Riya K., JEE 2026",
    line:
      "The predicted rank range was close to my actual result trajectory, and the daily insights helped me focus on weak chapters.",
    rating: 5
  },
  {
    name: "Aditya P., Dropper",
    line:
      "I used the topic tests every evening. The UI is clean and serious, and the analysis feels practical instead of noisy.",
    rating: 5
  },
  {
    name: "Mentor Feedback",
    line:
      "Students stay accountable because points and badges are tied to useful habits, not random streak gimmicks.",
    rating: 4
  },
  {
    name: "Neha S., JEE 2027",
    line: "The chapter-level drill system made my weak topics measurable and fixable.",
    rating: 5
  },
  {
    name: "Parent Review",
    line: "The platform has a clean structure and helps maintain a disciplined study routine.",
    rating: 4
  },
  {
    name: "Aakash R., Drop Year",
    line: "I improved test planning and confidence because feedback comes immediately after mocks.",
    rating: 5
  }
];

export default function MarketingPage() {
  return (
    <section className="page">
      <div className="page-head">
        <p className="eyebrow">Platform Overview</p>
        <h1>One Focused Workspace for JEE Preparation</h1>
        <p className="hero-copy">
          Built to convert daily effort into measurable performance, with a modern prep experience students actually
          enjoy returning to.
        </p>
      </div>

      <div className="marketing-stats">
        <article className="card stat-lite">
          <span className="tiny-icon blue">
            <TrendIcon size={14} />
          </span>
          <strong>50K+</strong>
          <p className="muted">Practice attempts logged</p>
        </article>
        <article className="card stat-lite">
          <span className="tiny-icon green">
            <TargetIcon size={14} />
          </span>
          <strong>92%</strong>
          <p className="muted">Students report better revision focus</p>
        </article>
        <article className="card stat-lite">
          <span className="tiny-icon amber">
            <AwardIcon size={14} />
          </span>
          <strong>All-in-One</strong>
          <p className="muted">Tests, analytics, leaderboard, resources</p>
        </article>
      </div>

      <div className="grid-2 feature-grid">
        {features.map((feature) => (
          <article key={feature.title} className="card feature-card">
            <div className="feature-image-slot feature-image-theme">
              <img src={feature.imageLight} alt={`${feature.title} preview`} className="feature-img feature-img-light" />
              <img src={feature.imageDark} alt={`${feature.title} preview`} className="feature-img feature-img-dark" />
            </div>
            <span className="feature-icon">
              <feature.icon size={14} />
              Feature
            </span>
            <h3>{feature.title}</h3>
            <p>{feature.detail}</p>
            <ul className="feature-bullets">
              {feature.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <section className="reviews-section">
        <div className="section-head">
          <p className="eyebrow">Student Reviews</p>
          <h2>Trusted by Serious Aspirants</h2>
        </div>
        <ReviewSlider reviews={reviews} />
      </section>

      <div className="cta-row">
        <Link href="/" className="btn btn-solid">
          Go to Home
        </Link>
        <Link href="/tests" className="btn btn-outline">
          Start a Test
        </Link>
      </div>

      <section className="cta-banner">
        <h2>Scale your preparation with smarter testing and tighter feedback loops.</h2>
        <p>From chapter drills to exam simulation, every interaction is built to improve results.</p>
        <Link href="/tests" className="btn btn-solid">
          Launch Test Workspace
        </Link>
      </section>

      <footer className="marketing-footer">
        <div>
          <h3>Tayyari</h3>
          <p className="muted">Focused preparation platform for JEE Main and Advanced aspirants.</p>
        </div>
        <div>
          <h4>Platform</h4>
          <p className="muted">Tests, AI analysis, rank forecasting, leaderboards, resources.</p>
        </div>
        <div>
          <h4>Support</h4>
          <p className="muted">Mentor mode, feedback loops, and weekly progress summaries.</p>
        </div>
      </footer>
    </section>
  );
}

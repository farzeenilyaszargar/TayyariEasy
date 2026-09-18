import Link from "next/link";
import { FlaskIcon, TargetIcon, TrendIcon, TrophyIcon } from "@/components/ui-icons";

const metrics = [
  { label: "Tests completed", value: "0", note: "Start your first test", icon: FlaskIcon },
  { label: "Average score", value: "—", note: "No score recorded", icon: TrendIcon },
  { label: "Accuracy", value: "—", note: "Build your baseline", icon: TargetIcon },
  { label: "Current streak", value: "0 days", note: "Consistency starts today", icon: TrophyIcon }
];

const actions = [
  { title: "Take a full-length test", detail: "See where your preparation stands", href: "/tests" },
  { title: "Practice by subject", detail: "Build confidence one subject at a time", href: "/tests" },
  { title: "Review your progress", detail: "Your trends will appear after a test", href: "/tests" }
];

export default function DashboardPage() {
  return (
    <section className="page dashboard-page">
      <header className="dashboard-page-header">
        <div>
          <h1>Your dashboard</h1>
          <p className="muted">A clear view of your preparation, progress, and next move.</p>
        </div>
        <Link href="/tests" className="btn btn-solid">Take a test</Link>
      </header>

      <section className="dashboard-summary-grid" aria-label="Preparation summary">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article className="dashboard-summary-card" key={metric.label}>
              <div className="dashboard-summary-icon"><Icon size={18} /></div>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.note}</small>
            </article>
          );
        })}
      </section>

      <div className="dashboard-main-grid">
        <section className="dashboard-panel dashboard-performance-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Performance overview</h2>
              <p className="muted">Your score and accuracy trend will appear here.</p>
            </div>
            <span className="dashboard-period">Last 30 days</span>
          </div>
          <div className="dashboard-empty-chart">
            <svg viewBox="0 0 640 220" role="img" aria-label="Empty performance chart">
              <line x1="34" y1="30" x2="34" y2="188" />
              <line x1="34" y1="188" x2="610" y2="188" />
              <line x1="34" y1="80" x2="610" y2="80" />
              <line x1="34" y1="134" x2="610" y2="134" />
            </svg>
            <div className="dashboard-chart-message">
              <TrendIcon size={22} />
              <strong>No performance data yet</strong>
              <span>Complete a test to start tracking your progress.</span>
              <Link href="/tests" className="btn btn-outline">Browse tests</Link>
            </div>
          </div>
        </section>

        <aside className="dashboard-panel dashboard-actions-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Next actions</h2>
              <p className="muted">Keep your preparation moving.</p>
            </div>
          </div>
          <div className="dashboard-action-list">
            {actions.map((action, index) => (
              <Link href={action.href} className="dashboard-action" key={action.title}>
                <span className="dashboard-action-number">0{index + 1}</span>
                <span className="dashboard-action-copy"><strong>{action.title}</strong><small>{action.detail}</small></span>
                <span className="dashboard-action-arrow">→</span>
              </Link>
            ))}
          </div>
        </aside>
      </div>

      <section className="dashboard-panel dashboard-recent-panel">
        <div className="dashboard-panel-header">
          <div>
            <h2>Recent tests</h2>
            <p className="muted">Your latest attempts will be listed here.</p>
          </div>
          <Link href="/tests" className="text-link">View test series →</Link>
        </div>
        <div className="dashboard-empty-table">
          <span>No tests attempted yet.</span>
          <Link href="/tests" className="btn btn-solid">Start your first test</Link>
        </div>
      </section>
    </section>
  );
}

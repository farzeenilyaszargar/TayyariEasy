"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { fetchDashboardData, type DashboardPayload } from "@/lib/supabase-db";

const emptyData: DashboardPayload = {
  profile: null,
  analytics: null,
  badges: [],
  tests: [],
  insights: []
};

function buildGraphPoints(values: number[]) {
  if (values.length === 0) {
    return "40,160 390,160";
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);

  return values
    .map((value, idx) => {
      const x = 40 + (idx * 350) / Math.max(1, values.length - 1);
      const y = 160 - ((value - min) / span) * 110;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardPayload>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState("");
  const [coachAnalysis, setCoachAnalysis] = useState("");

  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!user.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const payload = await fetchDashboardData(user.id);
        if (alive) {
          setData(payload);
        }
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard data from Supabase.");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      alive = false;
    };
  }, [user.id]);

  const scoreSeries = useMemo(
    () => data.tests.slice().reverse().map((item) => Number(item.score)).filter((item) => !Number.isNaN(item)),
    [data.tests]
  );
  const graphPath = buildGraphPoints(scoreSeries);
  const firstScore = scoreSeries[0] ?? null;
  const latestScore = scoreSeries[scoreSeries.length - 1] ?? null;
  const growth = firstScore !== null && latestScore !== null ? latestScore - firstScore : null;
  const analytics = data.analytics;
  const rankRange =
    analytics && analytics.predicted_rank_low != null && analytics.predicted_rank_high != null
      ? `${analytics.predicted_rank_low} - ${analytics.predicted_rank_high}`
      : "Not available";
  const scoreRange =
    analytics && analytics.estimated_score_low != null && analytics.estimated_score_high != null
      ? `${analytics.estimated_score_low} - ${analytics.estimated_score_high}`
      : "Not available";

  const runCoachAnalysis = async () => {
    setCoachLoading(true);
    setCoachError("");
    try {
      const response = await fetch("/api/ai/dashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          rankRange,
          scoreRange,
          confidence: analytics?.confidence_label || "Not available",
          points: data.profile?.points ?? 0,
          streak: data.profile?.current_streak ?? 0,
          testsCompleted: data.profile?.tests_completed ?? 0,
          recentScores: data.tests.slice(0, 8).map((item) => Number(item.score)).filter((n) => !Number.isNaN(n)),
          insights: data.insights.map((item) => item.insight)
        })
      });

      const payload = (await response.json()) as { analysis?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "AI coach request failed.");
      }

      setCoachAnalysis(payload.analysis || "");
    } catch (err) {
      setCoachError(err instanceof Error ? err.message : "Unable to generate AI analysis.");
    } finally {
      setCoachLoading(false);
    }
  };

  return (
    <div className="dashboard-grid">
      <section className="card profile-card">
        <div className="profile-head">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={`${user.name} profile`} className="profile-avatar" />
          ) : (
            <div className="profile-avatar profile-avatar-fallback">{user.name.charAt(0).toUpperCase()}</div>
          )}
          <div>
            <p className="eyebrow">Welcome Back</p>
            <h3>{data.profile?.full_name || user.name}</h3>
            <p className="muted">
              {data.profile?.target_exam || "No target exam set"} | {data.profile?.current_streak ?? 0} day streak
            </p>
          </div>
        </div>
      </section>

      <section className="card stat-card stat-rank">
        <p className="eyebrow">Predicted All India Rank</p>
        <span className="tiny-icon blue">R</span>
        <h2>
          {analytics && analytics.predicted_rank_low != null && analytics.predicted_rank_high != null
            ? `${analytics.predicted_rank_low.toLocaleString()} - ${analytics.predicted_rank_high.toLocaleString()}`
            : "Not available"}
        </h2>
        <p className="muted">Live from Supabase analytics.</p>
      </section>

      <section className="card stat-card stat-score">
        <p className="eyebrow">Estimated Next JEE Main Score</p>
        <span className="tiny-icon green">S</span>
        <h2>
          {analytics && analytics.estimated_score_low != null && analytics.estimated_score_high != null
            ? `${analytics.estimated_score_low} - ${analytics.estimated_score_high}`
            : "Not available"}
        </h2>
        <p className="muted">Confidence: {analytics?.confidence_label || "Not available"}</p>
      </section>

      <section className="card badge-card">
        <h3>Points and Badges</h3>
        <div className="point-meter" aria-label="Current points">
          <span>{(data.profile?.points ?? 0).toLocaleString()} points</span>
          <small>{(data.profile?.tests_completed ?? 0).toLocaleString()} tests completed</small>
        </div>
        <div className="badge-list">
          {data.badges.length > 0 ? (
            data.badges.map((badge, idx) => (
              <div key={badge.id} className={`badge-item badge-tone-${(idx % 3) + 1}`}>
                <strong>{badge.badge_name}</strong>
                <p>{badge.badge_detail}</p>
              </div>
            ))
          ) : (
            <p className="muted">No badges earned yet.</p>
          )}
        </div>
      </section>

      <section className="card">
        <h3>Performance Graph</h3>
        <svg className="graph-svg" viewBox="0 0 420 190" role="img" aria-label="Score progress graph">
          <polyline className="graph-axis" points="40,20 40,160 390,160" />
          <polyline className="graph-path" points={graphPath} />
        </svg>
        <p className="muted">
          {growth === null ? "Not enough test attempts to compute trend." : `Last trend change: ${growth >= 0 ? "+" : ""}${growth.toFixed(1)} marks`}
        </p>
      </section>

      <section className="card">
        <h3>Tests Taken</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Test</th>
                <th>Date</th>
                <th>Score</th>
                <th>Percentile</th>
              </tr>
            </thead>
            <tbody>
              {data.tests.length > 0 ? (
                data.tests.map((test) => (
                  <tr key={test.id}>
                    <td>{test.test_name}</td>
                    <td>{test.attempted_at}</td>
                    <td>{test.score}</td>
                    <td>{test.percentile}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="muted">
                    No test attempts found in Supabase.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>AI Analysis</h3>
        <ul className="insight-list">
          {data.insights.length > 0 ? (
            data.insights.map((item) => <li key={item.id}>{item.insight}</li>)
          ) : (
            <li className="muted">No AI insights found in Supabase.</li>
          )}
        </ul>
        <div className="cta-row">
          <button className="btn btn-solid" onClick={() => void runCoachAnalysis()} disabled={coachLoading}>
            {coachLoading ? "Analyzing..." : "Generate AI Coach Analysis"}
          </button>
        </div>
        {coachError ? <p className="muted">{coachError}</p> : null}
        {coachAnalysis ? <pre className="coach-analysis">{coachAnalysis}</pre> : null}
      </section>

      {loading ? (
        <section className="card">
          <p className="muted">Loading dashboard from Supabase...</p>
        </section>
      ) : null}

      {error ? (
        <section className="card">
          <p className="muted">{error}</p>
        </section>
      ) : null}
    </div>
  );
}

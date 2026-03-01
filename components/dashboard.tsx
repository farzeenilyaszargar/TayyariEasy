"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { TargetIcon, TrendIcon } from "@/components/ui-icons";
import { fetchDashboardData, type DashboardPayload } from "@/lib/supabase-db";

const emptyData: DashboardPayload = {
  profile: null,
  analytics: null,
  badges: [],
  tests: [],
  insights: []
};

type ConservativeForecast = {
  scoreLow: number;
  scoreHigh: number;
  rankLow: number;
  rankHigh: number;
  confidence: string;
  method: string;
  riskNotes: string[];
  calculatedFrom: string;
};

function formatRange(low: number | null | undefined, high: number | null | undefined) {
  if (low == null || high == null) {
    return "???";
  }
  return `${low.toLocaleString()} - ${high.toLocaleString()}`;
}

function buildGraphGeometry(values: number[]) {
  if (values.length === 0) {
    const fallback = "40,160 390,160";
    return {
      path: fallback,
      area: "40,160 390,160 390,160 40,160",
      points: [] as Array<{ x: number; y: number; value: number }>,
      guides: [
        { y: 40, label: "--" },
        { y: 100, label: "--" },
        { y: 160, label: "--" }
      ]
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const paddedMin = Math.max(0, min - 8);
  const paddedMax = Math.min(300, max + 8);
  const span = Math.max(1, paddedMax - paddedMin);

  const points = values.map((value, idx) => {
    const x = 40 + (idx * 350) / Math.max(1, values.length - 1);
    const y = 160 - ((value - paddedMin) / span) * 120;
    return { x, y, value };
  });

  const path = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const area = `${path} 390,160 40,160`;

  return {
    path,
    area,
    points,
    guides: [
      { y: 40, label: String(Math.round(paddedMax)) },
      { y: 100, label: String(Math.round((paddedMin + paddedMax) / 2)) },
      { y: 160, label: String(Math.round(paddedMin)) }
    ]
  };
}

function mean(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, item) => sum + item, 0) / values.length;
}

function stdDev(values: number[]) {
  if (values.length <= 1) {
    return 0;
  }
  const avg = mean(values);
  const variance = values.reduce((sum, item) => sum + (item - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardPayload>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState("");
  const [coachAnalysis, setCoachAnalysis] = useState("");
  const [forecast, setForecast] = useState<ConservativeForecast | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState("");

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

  const analytics = data.analytics;

  const rawRankRange =
    analytics && analytics.predicted_rank_low != null && analytics.predicted_rank_high != null
      ? `${analytics.predicted_rank_low} - ${analytics.predicted_rank_high}`
      : "not_available";

  const rawScoreRange =
    analytics && analytics.estimated_score_low != null && analytics.estimated_score_high != null
      ? `${analytics.estimated_score_low} - ${analytics.estimated_score_high}`
      : "not_available";

  useEffect(() => {
    let alive = true;

    const runForecast = async () => {
      if (!user.id || scoreSeries.length === 0) {
        return;
      }

      setForecastLoading(true);
      setForecastError("");
      try {
        const response = await fetch("/api/ai/dashboard", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            includeAnalysis: false,
            rankRange: rawRankRange,
            scoreRange: rawScoreRange,
            confidence: analytics?.confidence_label || "Not available",
            points: data.profile?.points ?? 0,
            streak: data.profile?.current_streak ?? 0,
            testsCompleted: data.profile?.tests_completed ?? 0,
            recentScores: scoreSeries,
            insights: data.insights.map((item) => item.insight)
          })
        });

        const payload = (await response.json()) as { forecast?: ConservativeForecast; error?: string };
        if (!response.ok) {
          throw new Error(payload.error || "Failed to compute conservative forecast.");
        }

        if (alive) {
          setForecast(payload.forecast || null);
        }
      } catch (err) {
        if (alive) {
          setForecastError(err instanceof Error ? err.message : "Unable to compute conservative forecast.");
        }
      } finally {
        if (alive) {
          setForecastLoading(false);
        }
      }
    };

    void runForecast();
    return () => {
      alive = false;
    };
  }, [
    user.id,
    rawRankRange,
    rawScoreRange,
    analytics?.confidence_label,
    data.profile?.points,
    data.profile?.current_streak,
    data.profile?.tests_completed,
    data.insights,
    scoreSeries
  ]);

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
          includeAnalysis: true,
          rankRange: rawRankRange,
          scoreRange: rawScoreRange,
          confidence: analytics?.confidence_label || "Not available",
          points: data.profile?.points ?? 0,
          streak: data.profile?.current_streak ?? 0,
          testsCompleted: data.profile?.tests_completed ?? 0,
          recentScores: scoreSeries,
          insights: data.insights.map((item) => item.insight)
        })
      });

      const payload = (await response.json()) as {
        analysis?: string;
        forecast?: ConservativeForecast;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "AI coach request failed.");
      }

      setCoachAnalysis(payload.analysis || "");
      if (payload.forecast) {
        setForecast(payload.forecast);
      }
    } catch (err) {
      setCoachError(err instanceof Error ? err.message : "Unable to generate AI analysis.");
    } finally {
      setCoachLoading(false);
    }
  };

  const geometry = useMemo(() => buildGraphGeometry(scoreSeries), [scoreSeries]);
  const firstScore = scoreSeries[0] ?? null;
  const latestScore = scoreSeries[scoreSeries.length - 1] ?? null;
  const bestScore = scoreSeries.length > 0 ? Math.max(...scoreSeries) : null;
  const growth = firstScore !== null && latestScore !== null ? latestScore - firstScore : null;
  const avgScore = scoreSeries.length > 0 ? mean(scoreSeries) : null;
  const volatility = scoreSeries.length > 1 ? stdDev(scoreSeries) : null;

  const rankDisplay = forecast
    ? `${forecast.rankLow.toLocaleString()} - ${forecast.rankHigh.toLocaleString()}`
    : formatRange(analytics?.predicted_rank_low, analytics?.predicted_rank_high);

  const scoreDisplay = forecast
    ? `${forecast.scoreLow.toLocaleString()} - ${forecast.scoreHigh.toLocaleString()}`
    : formatRange(analytics?.estimated_score_low, analytics?.estimated_score_high);

  return (
    <div className="dashboard-grid dashboard-grid-beautified">
      <section className="card profile-card profile-card-hero">
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

      <div className="dashboard-columns">
        <div className="dashboard-col">
          <section className="card stat-card stat-rank stat-serious">
            <p className="eyebrow">Conservative AIR Forecast</p>
            <h2>{rankDisplay}</h2>
            <p className="muted">
              {forecast
                ? `Strict mode: pessimistic AI penalties applied. Confidence: ${forecast.confidence}.`
                : analytics
                  ? "Fallback: live Supabase analytics."
                  : "Take a full test to generate rank forecast."}
            </p>
            {forecast?.riskNotes?.[0] ? <p className="dashboard-note">{forecast.riskNotes[0]}</p> : null}
          </section>

          <section className="card badge-card">
            <h3>Points and Badges</h3>
            <div className="point-meter">
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
                <p className="muted">Take a test to start earning badges.</p>
              )}
            </div>
          </section>

          <section className="card dashboard-half dashboard-graph dashboard-graph-rich">
            <div className="dashboard-graph-head">
              <h3>Performance Analytics</h3>
              <span className="dashboard-metric-chip">
                <TrendIcon size={14} />
                {growth === null ? "No trend yet" : `${growth >= 0 ? "+" : ""}${growth.toFixed(1)} trend`}
              </span>
            </div>
            <svg className="graph-svg" viewBox="0 0 420 210" role="img" aria-label="Detailed score trend graph">
              <polyline className="graph-axis" points="40,20 40,170 390,170" />
              {geometry.guides.map((guide) => (
                <g key={guide.y}>
                  <line x1="40" y1={guide.y} x2="390" y2={guide.y} className="graph-guide" />
                  <text x="8" y={guide.y + 3} className="graph-label">{guide.label}</text>
                </g>
              ))}
              <polyline className="graph-area" points={geometry.area} />
              <polyline className="graph-path" points={geometry.path} />
              {geometry.points.map((point, idx) => (
                <circle
                  key={`${point.x}-${point.y}`}
                  cx={point.x}
                  cy={point.y}
                  r={idx === geometry.points.length - 1 ? 4.4 : 3}
                  className={idx === geometry.points.length - 1 ? "graph-dot graph-dot-latest" : "graph-dot"}
                />
              ))}
            </svg>
            <div className="dashboard-metrics-grid">
              <div className="dashboard-metric-box">
                <small>Attempts</small>
                <strong>{scoreSeries.length}</strong>
              </div>
              <div className="dashboard-metric-box">
                <small>Average</small>
                <strong>{avgScore == null ? "--" : avgScore.toFixed(1)}</strong>
              </div>
              <div className="dashboard-metric-box">
                <small>Best</small>
                <strong>{bestScore == null ? "--" : bestScore.toFixed(1)}</strong>
              </div>
              <div className="dashboard-metric-box">
                <small>Volatility</small>
                <strong>{volatility == null ? "--" : volatility.toFixed(1)}</strong>
              </div>
            </div>
            <p className="muted">
              {volatility == null
                ? "Take a test to unlock trend analytics."
                : `Volatility-adjusted forecast model is active. Lower volatility generally improves rank stability.`}
            </p>
          </section>
        </div>

        <div className="dashboard-col">
          <section className="card stat-card stat-score stat-serious">
            <p className="eyebrow">Conservative Score Forecast</p>
            <h2>{scoreDisplay}</h2>
            <p className="muted">
              {forecast
                ? `${forecast.calculatedFrom}`
                : `Confidence: ${analytics?.confidence_label || "Take a test"}`}
            </p>
            {forecastLoading ? <p className="dashboard-note">Recomputing strict forecast...</p> : null}
            {forecastError ? <p className="dashboard-note">{forecastError}</p> : null}
          </section>

          <section className="card dashboard-half dashboard-tests">
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
                        Take a test to populate this section.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="cta-row">
              <Link href="/tests" className="btn btn-solid">
                Take Test
              </Link>
            </div>
          </section>

          <section className="card dashboard-half dashboard-ai dashboard-ai-strong">
            <div className="dashboard-ai-head">
              <h3>AI Analysis</h3>
              <span className="dashboard-metric-chip">
                <TargetIcon size={14} />
                Conservative mode
              </span>
            </div>
            <ul className="insight-list">
              {data.insights.length > 0 ? (
                data.insights.map((item) => <li key={item.id}>{item.insight}</li>)
              ) : (
                <li className="muted">Take a test to generate AI insights.</li>
              )}
            </ul>
            <div className="cta-row">
              <button className="btn btn-solid" onClick={() => void runCoachAnalysis()} disabled={coachLoading}>
                {coachLoading ? "Analyzing..." : "Generate Strict AI Plan"}
              </button>
            </div>
            {coachError ? <p className="muted">{coachError}</p> : null}
            {coachAnalysis ? <pre className="coach-analysis">{coachAnalysis}</pre> : null}
          </section>
        </div>
      </div>

      {loading ? (
        <section className="card dashboard-status">
          <p className="muted">Loading dashboard from Supabase...</p>
        </section>
      ) : null}

      {error ? (
        <section className="card dashboard-status">
          <p className="muted">{error}</p>
        </section>
      ) : null}
    </div>
  );
}

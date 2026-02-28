"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { aiInsights, badges, testsTaken } from "@/lib/data";
import { fetchDashboardData, type DashboardPayload } from "@/lib/supabase-db";

const emptyData: DashboardPayload = {
  profile: null,
  analytics: null,
  badges: [],
  tests: [],
  insights: []
};

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardPayload>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          setError("Unable to load analytics from Supabase. Showing fallback data.");
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

  const rankText = useMemo(() => {
    if (data.analytics?.predicted_rank_low && data.analytics?.predicted_rank_high) {
      return `${data.analytics.predicted_rank_low.toLocaleString()} - ${data.analytics.predicted_rank_high.toLocaleString()}`;
    }
    return "2,100 - 3,200";
  }, [data.analytics]);

  const scoreText = useMemo(() => {
    if (data.analytics?.estimated_score_low && data.analytics?.estimated_score_high) {
      return `${data.analytics.estimated_score_low} - ${data.analytics.estimated_score_high}`;
    }
    return "192 - 205";
  }, [data.analytics]);

  const confidenceText = data.analytics?.confidence_label ?? "Medium-High";
  const profileName = data.profile?.full_name ?? user.name;
  const profileAvatar = data.profile?.avatar_url ?? user.avatarUrl;
  const points = data.profile?.points ?? user.points;
  const streak = data.profile?.current_streak ?? 0;
  const badgeRows = data.badges.length ? data.badges : badges.map((b, idx) => ({ id: idx + 1, badge_name: b.name, badge_detail: b.detail }));
  const testRows = data.tests.length
    ? data.tests.map((row) => ({
        name: row.test_name,
        date: row.attempted_at,
        score: row.score,
        percentile: row.percentile
      }))
    : testsTaken;
  const insightRows = data.insights.length ? data.insights.map((i) => i.insight) : aiInsights;

  return (
    <div className="dashboard-grid">
      <section className="card profile-card">
        <div className="profile-head">
          {profileAvatar ? (
            <img src={profileAvatar} alt={`${profileName} profile`} className="profile-avatar" />
          ) : (
            <div className="profile-avatar profile-avatar-fallback">{profileName.charAt(0).toUpperCase()}</div>
          )}
          <div>
            <p className="eyebrow">Welcome Back</p>
            <h3>{profileName}</h3>
            <p className="muted">
              {data.profile?.target_exam ?? "JEE Main & Advanced"} | {streak} day streak
            </p>
          </div>
        </div>
        {loading ? <small>Loading profile...</small> : null}
      </section>

      <section className="card stat-card stat-rank">
        <p className="eyebrow">Predicted All India Rank</p>
        <span className="tiny-icon blue">R</span>
        <h2>{rankText}</h2>
        <p className="muted">Estimated from your latest synced test attempts.</p>
      </section>

      <section className="card stat-card stat-score">
        <p className="eyebrow">Estimated Next JEE Main Score</p>
        <span className="tiny-icon green">S</span>
        <h2>{scoreText}</h2>
        <p className="muted">Confidence: {confidenceText}</p>
      </section>

      <section className="card badge-card">
        <h3>Points and Badges</h3>
        <div className="point-meter" aria-label="Current points">
          <span>{points.toLocaleString()} points</span>
          <small>{Math.max(0, 12000 - points).toLocaleString()} points to next badge tier</small>
        </div>
        <div className="badge-list">
          {badgeRows.map((badge, idx) => (
            <div key={badge.id} className={`badge-item badge-tone-${(idx % 3) + 1}`}>
              <strong>{badge.badge_name}</strong>
              <p>{badge.badge_detail}</p>
            </div>
          ))}
        </div>
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
              {testRows.map((test) => (
                <tr key={`${test.name}-${test.date}`}>
                  <td>{test.name}</td>
                  <td>{test.date}</td>
                  <td>{test.score}</td>
                  <td>{test.percentile}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>AI Analysis</h3>
        <ul className="insight-list">
          {insightRows.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {error ? (
        <section className="card">
          <p className="muted">{error}</p>
        </section>
      ) : null}
    </div>
  );
}

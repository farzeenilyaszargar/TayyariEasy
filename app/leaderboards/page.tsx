"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchPublicLeaderboard, type LeaderboardRow } from "@/lib/supabase-db";

export default function LeaderboardsPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await fetchPublicLeaderboard();
        if (alive) {
          setRows(result);
        }
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : "Failed to load leaderboard.");
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
  }, []);

  const topThree = useMemo(() => rows.slice(0, 3), [rows]);
  const rankGap = rows.length > 5 ? Math.max(0, rows[4].points - (rows[5]?.points ?? rows[4].points)) : 0;

  return (
    <section className="page leaderboard-page">
      <div className="page-head">
        <p className="eyebrow">Leaderboards</p>
        <h1>Compete Through Consistent Performance</h1>
      </div>

      {loading ? <article className="card">Loading...</article> : null}
      {error ? <article className="card">{error}</article> : null}

      {!loading && rows.length > 0 ? (
        <article className="card leaderboard-goal shiny-card">
          <strong>Your next milestone</strong>
          <p className="muted">
            Gap to next visible leaderboard slot: {rankGap.toLocaleString()} points. Complete more tests to climb rank.
          </p>
          <div className="goal-progress-wrap">
            <div className="goal-progress">
              <span style={{ width: `${Math.min(100, 100 - Math.min(99, rankGap / 20))}%` }} />
            </div>
            <small>Live progress generated from points.</small>
          </div>
        </article>
      ) : null}

      <section className="card podium-wrap shiny-card">
        <div className="section-head">
          <p className="eyebrow">Top Performers</p>
          <h2>Weekly Podium</h2>
        </div>
        {topThree.length === 3 ? (
          <div className="podium">
            <article className="podium-col second">
              <img src={topThree[1].avatar_url || "/avatars/2.svg"} alt={topThree[1].full_name || "Second place"} className="podium-avatar" />
              <strong>{topThree[1].full_name || "Student"}</strong>
              <small>{topThree[1].points} pts</small>
              <div className="podium-bar">#2</div>
            </article>
            <article className="podium-col first">
              <img src={topThree[0].avatar_url || "/avatars/1.svg"} alt={topThree[0].full_name || "First place"} className="podium-avatar" />
              <strong>{topThree[0].full_name || "Student"}</strong>
              <small>{topThree[0].points} pts</small>
              <div className="podium-bar">#1</div>
            </article>
            <article className="podium-col third">
              <img src={topThree[2].avatar_url || "/avatars/3.svg"} alt={topThree[2].full_name || "Third place"} className="podium-avatar" />
              <strong>{topThree[2].full_name || "Student"}</strong>
              <small>{topThree[2].points} pts</small>
              <div className="podium-bar">#3</div>
            </article>
          </div>
        ) : (
          <p className="muted">Need at least 3 users to render podium.</p>
        )}
      </section>

      <article className="card leaderboard-table-wrap">
        <div className="table-wrap">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Points</th>
                <th>Streak</th>
                <th>Reward</th>
                <th>Tests Completed</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry, idx) => {
                const rank = idx + 1;
                return (
                  <tr key={entry.user_id} className={`leader-row rank-${rank}`}>
                    <td>
                      <span className="rank-badge">#{rank}</span>
                    </td>
                    <td>{entry.full_name || "Student"}</td>
                    <td>{entry.points}</td>
                    <td>
                      <span className="streak-chip">{entry.current_streak}d</span>
                    </td>
                    <td>
                      <span className="reward-pill">{rank <= 3 ? "Legend Chest" : rank <= 8 ? "XP Boost" : "Coin Pack"}</span>
                    </td>
                    <td>{entry.tests_completed}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

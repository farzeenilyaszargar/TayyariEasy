import { useMemo } from "react";
import type { LeaderboardRow } from "@/lib/supabase-db";

const DEMO_LEADERBOARD_ROWS: LeaderboardRow[] = [
  { user_id: "demo-1", full_name: "Aarav Mehta", avatar_url: "/avatars/1.svg", points: 1860, current_streak: 18, tests_completed: 24 },
  { user_id: "demo-2", full_name: "Ananya Sharma", avatar_url: "/avatars/2.svg", points: 1745, current_streak: 15, tests_completed: 21 },
  { user_id: "demo-3", full_name: "Vihaan Kapoor", avatar_url: "/avatars/3.svg", points: 1680, current_streak: 13, tests_completed: 20 },
  { user_id: "demo-4", full_name: "Ishita Rao", avatar_url: "/avatars/1.svg", points: 1540, current_streak: 11, tests_completed: 18 },
  { user_id: "demo-5", full_name: "Kabir Singh", avatar_url: "/avatars/2.svg", points: 1475, current_streak: 9, tests_completed: 17 },
  { user_id: "demo-6", full_name: "Myra Nair", avatar_url: "/avatars/3.svg", points: 1390, current_streak: 8, tests_completed: 16 },
  { user_id: "demo-7", full_name: "Aditya Verma", avatar_url: "/avatars/1.svg", points: 1285, current_streak: 7, tests_completed: 14 },
  { user_id: "demo-8", full_name: "Sara Khan", avatar_url: "/avatars/2.svg", points: 1170, current_streak: 6, tests_completed: 13 },
  { user_id: "demo-9", full_name: "Reyansh Joshi", avatar_url: "/avatars/3.svg", points: 1065, current_streak: 5, tests_completed: 11 },
  { user_id: "demo-10", full_name: "Diya Patel", avatar_url: "/avatars/1.svg", points: 980, current_streak: 4, tests_completed: 10 }
];

export default function LeaderboardsPage() {
  const rows = DEMO_LEADERBOARD_ROWS;
  const topThree = useMemo(() => rows.slice(0, 3), [rows]);
  return (
    <section className="page leaderboard-page">
      <div className="page-head">
        <p className="result-eyebrow">Weekly leaderboard</p>
        <h1>See how consistent preparation adds up.</h1>
        <p className="muted">Build your streak, improve your score, and move up the Tayyari rankings.</p>
      </div>

      <div className="leaderboard-demo-note">
        <span className="result-status-dot" /> Demo rankings for the current preview. Live rankings will appear after leaderboard data is connected.
      </div>

      <section className="leaderboard-climb-card">
        <div className="leaderboard-climb-copy">
          <span className="leaderboard-kicker">Your weekly climb</span>
          <h2>Keep the streak alive.</h2>
          <p>Complete two more tests to unlock the Focus Finisher reward.</p>
          <div className="leaderboard-xp-track" aria-label="72 percent progress to next reward">
            <span style={{ width: "72%" }} />
          </div>
          <small>720 / 1,000 XP to next reward</small>
        </div>
        <div className="leaderboard-climb-stats">
          <div><span>Current rank</span><strong>#12</strong></div>
          <div><span>Weekly XP</span><strong>720</strong></div>
          <div><span>Best streak</span><strong>7 days</strong></div>
        </div>
      </section>

      <section className="leaderboard-missions">
        <div className="section-head leaderboard-subhead">
          <div>
            <span className="leaderboard-kicker">Level up</span>
            <h2>Active missions</h2>
          </div>
          <span className="muted">Earn XP and climb faster</span>
        </div>
        <div className="leaderboard-mission-grid">
          <article className="leaderboard-mission-card mission-blue">
            <span className="mission-icon">⚡</span>
            <div><strong>Daily sprint</strong><p>Finish one mock test</p></div>
            <b>+120 XP</b>
          </article>
          <article className="leaderboard-mission-card mission-green">
            <span className="mission-icon">◎</span>
            <div><strong>Subject master</strong><p>Attempt all 3 subjects</p></div>
            <b>+180 XP</b>
          </article>
          <article className="leaderboard-mission-card mission-gold">
            <span className="mission-icon">🔥</span>
            <div><strong>Keep the fire</strong><p>Maintain a 7-day streak</p></div>
            <b>+250 XP</b>
          </article>
        </div>
      </section>

      <section className="leaderboard-badges">
        <div className="section-head leaderboard-subhead">
          <div>
            <span className="leaderboard-kicker">Collect them all</span>
            <h2>Badges & milestones</h2>
          </div>
          <span className="muted">4 of 12 unlocked</span>
        </div>
        <div className="leaderboard-badge-grid">
          <article className="leaderboard-badge-card badge-earned"><span>⚡</span><div><strong>Quick starter</strong><small>First test completed</small></div></article>
          <article className="leaderboard-badge-card badge-earned"><span>🔥</span><div><strong>Seven day fire</strong><small>7-day streak reached</small></div></article>
          <article className="leaderboard-badge-card badge-locked"><span>✦</span><div><strong>Subject master</strong><small>Complete all subjects</small></div></article>
          <article className="leaderboard-badge-card badge-locked"><span>♛</span><div><strong>Top ten</strong><small>Reach the top 10</small></div></article>
        </div>
      </section>

      <section className="card podium-wrap shiny-card">
        <div className="section-head">
          <div>
            <span className="leaderboard-kicker">Top performers</span>
            <h2>Weekly podium</h2>
          </div>
          <span className="leaderboard-reset">Resets in 4d 12h</span>
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

      <div className="leaderboard-table-heading">
        <div>
          <span className="leaderboard-kicker">The full climb</span>
          <h2>All-time contenders</h2>
        </div>
        <span className="muted">10 demo students</span>
      </div>

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
                        <span className="reward-pill">{rank <= 3 ? "🏆 Legend Badge" : rank <= 8 ? "⚡ XP Boost" : "✦ Coin Pack"}</span>
                    </td>
                    <td>{entry.tests_completed}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="leaderboard-mobile-list">
          {rows.map((entry, idx) => {
            const rank = idx + 1;
            return (
              <article key={`mobile-${entry.user_id}`} className={`leaderboard-mobile-item rank-${rank}`}>
                <div className="leaderboard-mobile-top">
                  <span className="rank-badge">#{rank}</span>
                  <strong>{entry.full_name || "Student"}</strong>
                </div>
                <div className="leaderboard-mobile-meta">
                  <span>Points: {entry.points}</span>
                  <span className="streak-chip">{entry.current_streak}d streak</span>
                </div>
                <div className="leaderboard-mobile-meta">
                  <span className="reward-pill">{rank <= 3 ? "🏆 Legend Badge" : rank <= 8 ? "⚡ XP Boost" : "✦ Coin Pack"}</span>
                  <span>Tests: {entry.tests_completed}</span>
                </div>
              </article>
            );
          })}
        </div>
      </article>
    </section>
  );
}

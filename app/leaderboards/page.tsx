import { leaderboard } from "@/lib/data";

export default function LeaderboardsPage() {
  const topThree = leaderboard.slice(0, 3);

  return (
    <section className="page leaderboard-page">
      <div className="page-head">
        <p className="eyebrow">Leaderboards</p>
        <h1>Compete Through Consistent Performance</h1>
      </div>

      <article className="card leaderboard-goal shiny-card">
        <strong>Your next milestone</strong>
        <p className="muted">
          You are 490 points away from Rank #5. Complete 3 full mocks and 2 topic drills this week to close the gap.
        </p>
        <div className="goal-progress-wrap">
          <div className="goal-progress">
            <span style={{ width: "68%" }} />
          </div>
          <small>68% to next rank target</small>
        </div>
      </article>

      <div className="grid-3 leaderboard-missions">
        <article className="card mission-card mission-blue">
          <strong>Daily Mission</strong>
          <p className="muted">Attempt 1 topic test today</p>
          <span className="streak-chip">+80 XP</span>
        </article>
        <article className="card mission-card mission-green">
          <strong>Weekly Quest</strong>
          <p className="muted">Complete 4 tests this week</p>
          <span className="streak-chip">+420 XP</span>
        </article>
        <article className="card mission-card mission-gold">
          <strong>Streak Reward</strong>
          <p className="muted">Maintain 7-day activity streak</p>
          <span className="streak-chip">Badge Unlock</span>
        </article>
      </div>

      <section className="card podium-wrap shiny-card">
        <div className="section-head">
          <p className="eyebrow">Top Performers</p>
          <h2>Weekly Podium</h2>
        </div>
        <div className="podium">
          <article className="podium-col second">
            <img src="/avatars/2.svg" alt={topThree[1]?.name ?? "Second place"} className="podium-avatar" />
            <strong>{topThree[1]?.name}</strong>
            <small>{topThree[1]?.points} pts</small>
            <div className="podium-bar">#2</div>
          </article>
          <article className="podium-col first">
            <img src="/avatars/1.svg" alt={topThree[0]?.name ?? "First place"} className="podium-avatar" />
            <strong>{topThree[0]?.name}</strong>
            <small>{topThree[0]?.points} pts</small>
            <div className="podium-bar">#1</div>
          </article>
          <article className="podium-col third">
            <img src="/avatars/3.svg" alt={topThree[2]?.name ?? "Third place"} className="podium-avatar" />
            <strong>{topThree[2]?.name}</strong>
            <small>{topThree[2]?.points} pts</small>
            <div className="podium-bar">#3</div>
          </article>
        </div>
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
                <th>XP Progress</th>
                <th>Reward</th>
                <th>Tests Completed</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr key={entry.rank} className={`leader-row rank-${entry.rank}`}>
                  <td>
                    <span className="rank-badge">#{entry.rank}</span>
                  </td>
                  <td>{entry.name}</td>
                  <td>{entry.points}</td>
                  <td>
                    <span className="streak-chip">{Math.max(2, 8 - entry.rank)}d</span>
                  </td>
                  <td>
                    <div className="xp-track">
                      <span style={{ width: `${Math.min(100, 55 + (5 - entry.rank) * 10)}%` }} />
                    </div>
                  </td>
                  <td>
                    <span className="reward-pill">{entry.rank <= 3 ? "Legend Chest" : entry.rank <= 8 ? "XP Boost" : "Coin Pack"}</span>
                  </td>
                  <td>{entry.tests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

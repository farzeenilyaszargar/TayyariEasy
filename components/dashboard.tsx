import { aiInsights, badges, testsTaken } from "@/lib/data";

export function Dashboard() {
  return (
    <div className="dashboard-grid">
      <section className="card stat-card stat-rank">
        <p className="eyebrow">Predicted All India Rank</p>
        <span className="tiny-icon blue">R</span>
        <h2>2,100 - 3,200</h2>
        <p className="muted">Estimated from recent full-length and topic tests.</p>
      </section>
      <section className="card stat-card stat-score">
        <p className="eyebrow">Estimated Next JEE Main Score</p>
        <span className="tiny-icon green">S</span>
        <h2>192 - 205</h2>
        <p className="muted">Confidence: Medium-High based on consistency trend.</p>
      </section>
      <section className="card badge-card">
        <h3>Points and Badges</h3>
        <div className="point-meter" aria-label="Current points">
          <span>10,320 points</span>
          <small>680 points to next badge tier</small>
        </div>
        <div className="badge-list">
          {badges.map((badge, idx) => (
            <div key={badge.id} className={`badge-item badge-tone-${idx + 1}`}>
              <strong>{badge.name}</strong>
              <p>{badge.detail}</p>
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
              {testsTaken.map((test) => (
                <tr key={test.name}>
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
          {aiInsights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

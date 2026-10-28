"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Bar, LoginPrompt, ProGate, Stat } from "@/components/ui";
import { TEST_MAP } from "@/data/tests";
import { BADGES, earnedBadgeIds } from "@/lib/badges";
import { rankOf, testLeaderboard } from "@/lib/leaderboard";
import { analyze, DIFFICULTIES, estimatePercentile, estimateRank, fmtTime, type Outcome } from "@/lib/scoring";
import { store } from "@/lib/store";

const outcomeChip: Record<Outcome, string> = { correct: "chip-green", wrong: "chip-red", skipped: "chip-gray" };

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, attempts, ready } = useApp();
  const [reviewFilter, setReviewFilter] = useState<"all" | Outcome>("all");
  const attempt = ready ? store.getAttempt(id) : undefined;
  const analysis = useMemo(() => (attempt?.submittedAt ? analyze(attempt) : null), [attempt?.id, attempt?.submittedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return null;
  if (!user) return <LoginPrompt message="Log in to see your results." />;
  if (!attempt || !analysis) return <div className="container page"><h2>Result not found</h2></div>;

  const test = TEST_MAP[attempt.testId];
  const board = testLeaderboard(test.id, user, attempts);
  const rank = rankOf(board, user.id);
  const percentile = estimatePercentile(analysis.score, analysis.maxScore);

  const before = earnedBadgeIds(user, attempts.filter((a) => a.submittedAt && a.submittedAt < attempt.submittedAt!));
  const now = earnedBadgeIds(user, attempts.filter((a) => a.submittedAt && a.submittedAt <= attempt.submittedAt!));
  const newBadges = BADGES.filter((b) => now.has(b.id) && !before.has(b.id));

  const previous = attempts
    .filter((a) => a.testId === test.id && a.submittedAt && a.id !== attempt.id && a.submittedAt < attempt.submittedAt!)
    .sort((a, b) => b.submittedAt!.localeCompare(a.submittedAt!))[0];

  return (
    <div className="container page stack">
      <div className="spread">
        <div>
          <span className="muted small">{new Date(attempt.submittedAt!).toLocaleString()}</span>
          <h1>{test.title} — Result</h1>
        </div>
        <div className="row">
          <Link href={`/tests/${test.id}`} className="btn btn-ghost">Reattempt</Link>
          <Link href="/tests" className="btn">More tests</Link>
        </div>
      </div>

      {newBadges.length > 0 && (
        <div className="banner banner-info">
          🎉 New badge{newBadges.length > 1 ? "s" : ""} unlocked: {newBadges.map((b) => `${b.emoji} ${b.name}`).join(", ")}
          {" · "}<Link href="/badges"><b>See all badges</b></Link>
        </div>
      )}

      <div className="grid-4">
        <Stat value={<>{analysis.score}<span className="muted small"> / {analysis.maxScore}</span></>} label="Score" />
        <Stat value={rank ? `#${rank}` : "—"} label={`Rank on this test (of ${board.length})`} />
        <Stat value={`${Math.round(analysis.accuracy * 100)}%`} label="Accuracy" />
        <Stat value={`${analysis.correct} / ${analysis.wrong} / ${analysis.skipped}`} label="Correct / Wrong / Skipped" />
        <Stat value={fmtTime(analysis.timeSec)} label="Time taken" />
        <Stat value={`−${analysis.negativeMarks}`} label="Marks lost to negatives" />
      </div>

      <div className="card stack">
        <h3>Subject-wise performance</h3>
        {analysis.bySubject.map((b) => (
          <div key={b.key}>
            <div className="spread small"><b>{b.key}</b><span>{b.score}/{b.maxScore} · {b.correct}✓ {b.wrong}✗ {b.skipped}–</span></div>
            <Bar value={Math.max(0, b.score) / b.maxScore} />
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 32 }}>Deep analysis <span className="pro-tag">PRO</span></h2>
      <ProGate title="Percentile & rank prediction">
        <div className="grid-4">
          <Stat value={percentile.toFixed(2)} label="Predicted JEE Main percentile" />
          <Stat value={`~${estimateRank(percentile).toLocaleString("en-IN")}`} label="Predicted CRL rank" />
          <Stat value={previous ? `${analysis.score - (previous.score ?? 0) >= 0 ? "+" : ""}${analysis.score - (previous.score ?? 0)}` : "—"} label="Change vs. last attempt" />
        </div>
        <p className="muted small" style={{ marginTop: 10 }}>Prediction uses a placeholder curve; it becomes data-driven once real attempt volume exists.</p>
      </ProGate>

      <ProGate title="Chapter-wise strengths & weaknesses">
        <h3>Chapter-wise breakdown</h3>
        <div className="table-wrap"><table>
          <thead><tr><th>Chapter</th><th>Qs</th><th>Correct</th><th>Score</th><th>Time</th><th></th></tr></thead>
          <tbody>
            {analysis.byChapter.map((b) => {
              const pct = b.correct / b.total;
              return (
                <tr key={b.key}>
                  <td>{b.key}</td><td>{b.total}</td><td>{b.correct}</td><td>{b.score}</td><td>{fmtTime(b.timeSec)}</td>
                  <td><span className={`chip ${pct >= 0.75 ? "chip-green" : pct < 0.5 ? "chip-red" : "chip-amber"}`}>{pct >= 0.75 ? "Strong" : pct < 0.5 ? "Needs work" : "Okay"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
        {analysis.weakChapters.length > 0 && (
          <p style={{ marginTop: 12 }}><b>Focus next on:</b> {analysis.weakChapters.slice(0, 3).map((c) => c.key).join(", ")}</p>
        )}
      </ProGate>

      <ProGate title="Difficulty & time management">
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <div>
            <h3>By difficulty</h3>
            {DIFFICULTIES.map((d) => {
              const b = analysis.byDifficulty.find((x) => x.key === d);
              if (!b) return null;
              return (
                <div key={d} style={{ marginBottom: 10 }}>
                  <div className="spread small"><b style={{ textTransform: "capitalize" }}>{d}</b><span>{b.correct}/{b.total} correct · avg {fmtTime(b.timeSec / b.total)}</span></div>
                  <Bar value={b.correct / b.total} color={d === "easy" ? "var(--green)" : d === "medium" ? "var(--amber)" : "var(--red)"} />
                </div>
              );
            })}
          </div>
          <div>
            <h3>Behaviour insights</h3>
            <ul className="small">
              <li><b>{analysis.sillyMistakes.length}</b> silly mistakes (easy questions wrong){analysis.sillyMistakes.length > 0 && `: Q${analysis.sillyMistakes.map((r) => analysis.results.indexOf(r) + 1).join(", Q")}`}</li>
              <li><b>{analysis.overTime.length}</b> questions took more than 2× the ideal time</li>
              <li><b>{analysis.quickWrong.length}</b> likely guesses (wrong in under 30% of ideal time)</li>
              {analysis.bySubject.map((b) => <li key={b.key}>{b.key}: {fmtTime(b.timeSec)} spent ({Math.round((b.timeSec / Math.max(1, analysis.timeSec)) * 100)}% of time)</li>)}
            </ul>
          </div>
        </div>
      </ProGate>

      <ProGate title="Time spent per question">
        <h3>Time per question vs ideal</h3>
        <div className="table-wrap"><table>
          <thead><tr><th>Q</th><th>Chapter</th><th>Result</th><th>Your time</th><th>Ideal</th></tr></thead>
          <tbody>
            {analysis.results.map((r, i) => (
              <tr key={r.question.id}>
                <td>{i + 1}</td><td>{r.question.chapter}</td>
                <td><span className={`chip ${outcomeChip[r.outcome]}`}>{r.outcome}</span></td>
                <td style={{ color: r.timeSec > r.question.idealTimeSec * 2 ? "var(--red)" : undefined }}>{fmtTime(r.timeSec)}</td>
                <td className="muted">{fmtTime(r.question.idealTimeSec)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </ProGate>

      <div className="card stack" style={{ marginTop: 32 }}>
        <div className="spread">
          <h2>Answers & solutions</h2>
          <div className="tabs">
            {(["all", "correct", "wrong", "skipped"] as const).map((f) => (
              <button key={f} className={`tab ${reviewFilter === f ? "active" : ""}`} onClick={() => setReviewFilter(f)} style={{ textTransform: "capitalize" }}>{f}</button>
            ))}
          </div>
        </div>
        {analysis.results.map((r, i) => (reviewFilter === "all" || r.outcome === reviewFilter) && (
          <div key={r.question.id} className="review-item">
            <div className="spread small">
              <b>Q{i + 1} · {r.question.subject} · {r.question.chapter}</b>
              <span className={`chip ${outcomeChip[r.outcome]}`}>{r.outcome} ({r.marks > 0 ? "+" : ""}{r.marks})</span>
            </div>
            <p style={{ marginTop: 8 }}>{r.question.text}</p>
            {r.question.type === "mcq" ? (
              r.question.options!.map((o, oi) => (
                <div key={oi} className={`option ${oi === r.question.answer ? "correct" : oi === r.response ? "wrong" : ""}`} style={{ cursor: "default" }}>
                  <span className="key">{String.fromCharCode(65 + oi)}</span>{o}
                </div>
              ))
            ) : (
              <p className="small">Your answer: <b>{r.response ?? "—"}</b> · Correct answer: <b>{r.question.answer}</b></p>
            )}
            <div className="solution small"><b>Solution:</b> {r.question.solution}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

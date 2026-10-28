"use client";

import { ArrowLeft, CheckCircle2, Clock, Target, Trophy } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Bar, Loading, Notice, ProGate, StatTile } from "@/components/ui";
import { fetchBadges, fetchLeaderboard, fetchReview } from "@/lib/api";
import { analyze, DIFFICULTIES, estimatePercentile, estimateRank, fmtTime, type Outcome } from "@/lib/scoring";
import type { AnswerKey, Badge, LeaderboardEntry } from "@/lib/types";

const outcomeTag: Record<Outcome, string> = { correct: "tag-green", wrong: "tag-red", skipped: "" };
const SUBJECT_COLOR: Record<string, string> = { Physics: "var(--blue)", Chemistry: "var(--green)", Mathematics: "var(--orange)" };
const outcomeLabel: Record<Outcome, string> = { correct: "Correct", wrong: "Wrong", skipped: "Skipped" };

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, attempts, ready, testMap, questionMap, earnedBadges } = useApp();
  const [filter, setFilter] = useState<"all" | Outcome>("all");
  const [keys, setKeys] = useState<Record<string, AnswerKey> | null>(null);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const attempt = attempts.find((a) => a.id === id);
  const test = attempt ? testMap[attempt.testId] : undefined;

  useEffect(() => {
    if (!attempt?.submittedAt) return;
    fetchReview(attempt.id).then(setKeys).catch(() => setKeys({}));
    fetchLeaderboard("test", attempt.testId, 1000).then(setBoard).catch(() => {});
    fetchBadges().then(setBadges).catch(() => {});
  }, [attempt?.id, attempt?.submittedAt, attempt?.testId]);

  const analysis = useMemo(
    () => (attempt && test && keys ? analyze(attempt, test, questionMap, keys) : null),
    [attempt, test, questionMap, keys],
  );

  if (!ready) return <Loading />;
  if (!attempt || !test || !attempt.submittedAt) return <div className="page"><h1>Result not found</h1></div>;
  if (!analysis) return <Loading />;

  const rank = board.find((e) => e.isYou)?.rank ?? null;
  const percentile = estimatePercentile(analysis.score, analysis.maxScore);
  const submittedMs = new Date(attempt.submittedAt).getTime();
  const newBadges = badges.filter((b) => earnedBadges.some((e) => e.badgeId === b.id && Math.abs(new Date(e.earnedAt).getTime() - submittedMs) < 15000));
  const previous = attempts
    .filter((a) => a.testId === test.id && a.submittedAt && a.id !== attempt.id && a.submittedAt < attempt.submittedAt!)
    .sort((a, b) => b.submittedAt!.localeCompare(a.submittedAt!))[0];
  const delta = previous ? analysis.score - (previous.score ?? 0) : null;

  return (
    <div className="page stack">
      <Link href="/analytics" className="row muted small" style={{ gap: 6 }}><ArrowLeft size={18} />Dashboard</Link>
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <h1>{test.title}</h1>
          <p>Submitted {new Date(attempt.submittedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
        </div>
        <div className="row">
          <Link href={`/papers/${test.id}`} className="btn btn-white btn-sm">Try again</Link>
          <Link href="/papers" className="btn btn-sm">Next paper</Link>
        </div>
      </div>

      {newBadges.length > 0 && (
        <Notice kind="green">
          Badge{newBadges.length > 1 ? "s" : ""} earned: {newBadges.map((b) => `${b.name} (+${b.points} pts)`).join(", ")}.{" "}
          <Link href="/profile" className="link">View badges</Link>
        </Notice>
      )}

      <div className="stat-tiles">
        <StatTile icon={<Target size={20} />} color="var(--yellow)" value={`${analysis.score}/${analysis.maxScore}`} label="Score" />
        <StatTile icon={<Trophy size={20} />} color="var(--blue)" value={rank ? `#${rank}` : "–"} label={`Rank of ${board.length || 1}`} />
        <StatTile icon={<CheckCircle2 size={20} />} color="var(--green)" value={`${Math.round(analysis.accuracy * 100)}%`} label={`${analysis.correct} right · ${analysis.wrong} wrong`} />
        <StatTile icon={<Clock size={20} />} color="var(--purple)" value={fmtTime(analysis.timeSec)} label="Time taken" />
      </div>

      <div className="card stack-sm">
        <h2>By subject</h2>
        {analysis.bySubject.map((b) => (
          <div key={b.key} className="meter-row">
            <span style={{ fontWeight: 800 }}>{b.key}</span>
            <Bar value={Math.max(0, b.score) / b.maxScore} color={SUBJECT_COLOR[b.key]} />
            <span className="r">{b.score} / {b.maxScore}</span>
          </div>
        ))}
        {analysis.negativeMarks > 0 && <p className="muted small" style={{ marginTop: 14 }}>{analysis.negativeMarks} marks lost to wrong answers.</p>}
      </div>

      <div className="spread" style={{ marginTop: 36 }}>
        <h2>Detailed analysis <span className="tag tag-pro">Pro</span></h2>
      </div>

      <ProGate title="Predicted percentile and rank">
        <div className="stat-tiles">
          <StatTile icon={<Target size={20} />} color="var(--purple)" value={percentile.toFixed(2)} label="Predicted percentile" />
          <StatTile icon={<Trophy size={20} />} color="var(--blue)" value={`~${estimateRank(percentile).toLocaleString("en-IN")}`} label="Predicted CRL rank" />
          <StatTile icon={<CheckCircle2 size={20} />} color="var(--green)" value={delta === null ? "–" : `${delta >= 0 ? "+" : ""}${delta}`} label="vs last attempt" />
        </div>
        <p className="muted xs" style={{ marginTop: 10 }}>Estimated from a reference curve; becomes data-driven as more students take tests.</p>
      </ProGate>

      <ProGate title="Chapter strengths and weaknesses">
        <div className="table-wrap"><table>
          <thead><tr><th>Chapter</th><th className="r">Questions</th><th className="r">Correct</th><th className="r">Score</th><th className="r">Time</th><th></th></tr></thead>
          <tbody>
            {analysis.byChapter.map((b) => {
              const pct = b.correct / b.total;
              return (
                <tr key={b.key}>
                  <td>{b.key}</td><td className="r num">{b.total}</td><td className="r num">{b.correct}</td><td className="r num">{b.score}</td><td className="r num">{fmtTime(b.timeSec)}</td>
                  <td className="r"><span className={`tag ${pct >= 0.75 ? "tag-green" : pct < 0.5 ? "tag-red" : ""}`}>{pct >= 0.75 ? "Strong" : pct < 0.5 ? "Revise" : "Fair"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
        {analysis.weakChapters.length > 0 && (
          <p className="small" style={{ marginTop: 14 }}><b>Revise next:</b> {analysis.weakChapters.slice(0, 3).map((c) => c.key).join(", ")}</p>
        )}
      </ProGate>

      <ProGate title="Difficulty and time management">
        <div className="cols-2">
          <div className="stack-sm">
            <h3>Accuracy by difficulty</h3>
            {DIFFICULTIES.map((d) => {
              const b = analysis.byDifficulty.find((x) => x.key === d);
              if (!b) return null;
              return (
                <div key={d} className="meter-row">
                  <span style={{ textTransform: "capitalize" }}>{d}</span>
                  <Bar value={b.correct / b.total} />
                  <span className="r">{b.correct}/{b.total}</span>
                </div>
              );
            })}
          </div>
          <div className="stack-sm">
            <h3>Habits</h3>
            <ul className="small" style={{ color: "var(--text-2)" }}>
              <li>{analysis.sillyMistakes.length} easy question{analysis.sillyMistakes.length === 1 ? "" : "s"} answered wrong{analysis.sillyMistakes.length > 0 && ` (Q${analysis.sillyMistakes.map((r) => analysis.results.indexOf(r) + 1).join(", Q")})`}</li>
              <li>{analysis.overTime.length} question{analysis.overTime.length === 1 ? "" : "s"} took more than twice the expected time</li>
              <li>{analysis.quickWrong.length} likely guess{analysis.quickWrong.length === 1 ? "" : "es"} (wrong in under 30% of expected time)</li>
              {analysis.bySubject.map((b) => <li key={b.key}>{b.key}: {fmtTime(b.timeSec)} ({Math.round((b.timeSec / Math.max(1, analysis.timeSec)) * 100)}% of your time)</li>)}
            </ul>
          </div>
        </div>
      </ProGate>

      <ProGate title="Time per question">
        <div className="table-wrap"><table>
          <thead><tr><th>#</th><th>Chapter</th><th>Result</th><th className="r">Your time</th><th className="r">Expected</th></tr></thead>
          <tbody>
            {analysis.results.map((r, i) => (
              <tr key={r.question.id}>
                <td className="rank">{i + 1}</td><td>{r.question.chapter}</td>
                <td><span className={`tag ${outcomeTag[r.outcome]}`}>{outcomeLabel[r.outcome]}</span></td>
                <td className="r num" style={{ color: r.timeSec > r.question.idealTimeSec * 2 ? "var(--red)" : undefined }}>{fmtTime(r.timeSec)}</td>
                <td className="r num muted">{fmtTime(r.question.idealTimeSec)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </ProGate>

      <div className="card card-tight" style={{ marginTop: 36 }}>
        <div className="card-head" style={{ paddingBottom: 0 }}>
          <h2>Solutions</h2>
          <div className="chips">
            {(["all", "correct", "wrong", "skipped"] as const).map((f) => (
              <button key={f} className={`chip-btn ${filter === f ? "active" : ""}`} style={{ height: 34 }} onClick={() => setFilter(f)}>{f === "all" ? "All" : outcomeLabel[f]}</button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          {analysis.results.map((r, i) => (filter === "all" || r.outcome === filter) && (
            <div key={r.question.id} className="review-item">
              <div className="spread small">
                <span className="muted">Q{i + 1} · {r.question.subject} · {r.question.chapter}</span>
                <span className={`tag ${outcomeTag[r.outcome]}`}>{outcomeLabel[r.outcome]} · {r.marks > 0 ? "+" : ""}{r.marks}</span>
              </div>
              <p style={{ margin: "10px 0 12px" }}>{r.question.text}</p>
              {r.question.type === "mcq" ? (
                (r.question.options ?? []).map((o, oi) => (
                  <div key={oi} className={`option static ${oi === r.key.answer ? "correct" : oi === r.response ? "wrong" : ""}`}>
                    <span className="key">{String.fromCharCode(65 + oi)}</span>{o}
                  </div>
                ))
              ) : (
                <p className="small">Your answer: <b>{r.response ?? "—"}</b> · Correct answer: <b>{r.key.answer}</b></p>
              )}
              <div className="solution"><b>Solution.</b> {r.key.solution}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { ArrowLeft, Clock, FileText, Target } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Avatar } from "@/components/Avatar";
import { PaperIcon } from "@/components/PaperCard";
import { Loading, Notice, ProMini, StatTile, kindLabel } from "@/components/ui";
import { fetchLeaderboard, friendlyError, startAttempt } from "@/lib/api";
import { MARKS_CORRECT, MARKS_WRONG } from "@/lib/config";
import { quotaFor } from "@/lib/quota";
import { SUBJECTS } from "@/lib/scoring";
import type { LeaderboardEntry } from "@/lib/types";

export default function PaperDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, attempts, ready, testMap, questionMap, refresh } = useApp();
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchLeaderboard("test", id, 10).then(setBoard).catch(() => {}); }, [id, user?.id]);

  const test = testMap[id];
  if (!ready) return <Loading />;
  if (!test) return <div className="page"><h1>Paper not found</h1></div>;

  const inProgress = attempts.find((a) => a.testId === id && !a.submittedAt);
  const past = attempts.filter((a) => a.testId === id && a.submittedAt);
  const quota = quotaFor(user, attempts);
  const sections = SUBJECTS.map((s) => [s, test.questionIds.filter((q) => questionMap[q]?.subject === s).length] as const).filter(([, n]) => n);
  const isDemo = test.kind === "demo";
  const blocked = !isDemo && !inProgress && quota.remaining <= 0;

  async function start() {
    setBusy(true); setError("");
    try {
      const attempt = await startAttempt(id);
      await refresh();
      router.push(`/papers/${id}/attempt?a=${attempt.id}`);
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  }

  return (
    <div className="page stack">
      <Link href="/papers" className="row muted small" style={{ gap: 6 }}><ArrowLeft size={18} />All papers</Link>

      <div className="row" style={{ gap: 18, alignItems: "flex-start" }}>
        <PaperIcon test={test} size={72} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row" style={{ gap: 6, marginBottom: 6 }}>
            <span className="tag tag-blue">{kindLabel[test.kind]}</span>
            {test.subject && <span className="tag">{test.subject}</span>}
          </div>
          <h1>{test.title}</h1>
          <p className="muted" style={{ marginTop: 4 }}>{test.description}</p>
        </div>
      </div>

      <div className="cols-main">
        <div className="stack">
          <div className="stat-tiles">
            <StatTile icon={<FileText size={20} />} color="var(--blue)" value={test.questionIds.length} label="Questions" />
            <StatTile icon={<Clock size={20} />} color="var(--orange)" value={`${test.durationMin} min`} label="Duration" />
            <StatTile icon={<Target size={20} />} color="var(--green)" value={test.questionIds.length * MARKS_CORRECT} label="Max marks" />
          </div>

          <div className="card stack-sm">
            <h2>How it works</h2>
            <ul className="muted" style={{ fontWeight: 700 }}>
              <li>+{MARKS_CORRECT} for a correct answer, {MARKS_WRONG} for a wrong one, 0 if skipped.</li>
              <li>Numerical questions need a typed number.</li>
              <li>Marked-for-review answers still count.</li>
              <li>The paper submits itself when the timer hits zero. Refreshing won&apos;t lose your answers.</li>
              <li>Sections: {sections.map(([s, n]) => `${s} (${n})`).join(", ")}.</li>
            </ul>
          </div>

          {blocked && <Notice kind="yellow">You&apos;ve used this week&apos;s free papers. They come back on Monday.</Notice>}
          {error && <Notice kind="red">{error}</Notice>}

          <div className="stack-sm" style={{ maxWidth: 420 }}>
            <button className="btn btn-lg btn-block" onClick={start} disabled={busy || blocked}>
              {busy ? "Starting…" : inProgress ? "Resume paper" : past.length ? "Try again" : "Start paper"}
            </button>
            {!isDemo && !inProgress && !blocked && !quota.unlimited && (
              <p className="muted small center">Uses 1 of your {quota.remaining} free paper{quota.remaining === 1 ? "" : "s"} this week</p>
            )}
          </div>

          {!isDemo && !inProgress && !quota.unlimited && quota.remaining <= 1 && (
            <ProMini text={blocked ? "Don't wait for Monday. Pro unlocks unlimited papers." : "This is your last free paper this week. Pro gives you unlimited papers."} />
          )}

          {past.length > 0 && (
            <div className="card card-tight">
              <div className="card-head"><h3>Your attempts</h3></div>
              <table><tbody>
                {past.map((a) => (
                  <tr key={a.id}>
                    <td className="muted">{new Date(a.submittedAt!).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="num"><b>{a.score}</b> / {a.maxScore}</td>
                    <td className="r"><Link className="link" href={`/results/${a.id}`}>Solutions</Link></td>
                  </tr>
                ))}
              </tbody></table>
            </div>
          )}
        </div>

        <div className="card stack-sm">
          <div className="spread"><h3>Top scores</h3><Link href={`/leaderboard?test=${id}`} className="link small">See all</Link></div>
          {board.length === 0 ? <p className="muted small">No scores yet. Be the first!</p> : board.map((e) => (
            <div key={e.userId} className={`lb-row ${e.isYou ? "you" : ""}`} style={{ padding: "8px 10px" }}>
              <span className={`rank rank-${e.rank}`}>{e.rank}</span>
              <Avatar name={e.name} url={e.avatarUrl} color={e.avatarColor} size={30} />
              <span className="name small">{e.isYou ? "You" : e.name}</span>
              <span className="score small">{e.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

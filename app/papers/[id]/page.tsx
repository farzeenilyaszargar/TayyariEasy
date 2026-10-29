"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Avatar } from "@/components/Avatar";
import { IconTile, type IconName } from "@/components/Icon";
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
            <StatTile solid icon="paper" value={test.questionIds.length} label="Questions" />
            <StatTile solid icon="stopwatch" value={`${test.durationMin} min`} label="Duration" />
            <StatTile solid icon="medal" value={test.questionIds.length * MARKS_CORRECT} label="Max marks" />
          </div>

          <div className="card">
            <h2 style={{ marginBottom: 16 }}>How it <em>works</em></h2>
            <div className="rules">
              {([
                ["target", `+${MARKS_CORRECT} for a correct answer, ${MARKS_WRONG} for a wrong one, 0 if skipped.`],
                ["abacus", "Numerical questions need a typed number."],
                ["flag", "Marked-for-review answers still count."],
                ["stopwatch", "The paper submits itself at zero. Refreshing won't lose your answers."],
              ] as [IconName, string][]).map(([icon, text]) => (
                <div key={text} className="rule"><IconTile name={icon} size={36} /><span>{text}</span></div>
              ))}
            </div>
          </div>

          {blocked && <Notice kind="yellow">You&apos;ve used this week&apos;s free papers. They come back on Monday.</Notice>}
          {error && <Notice kind="red">{error}</Notice>}

          <div className="start-card">
            <div style={{ flex: 1, minWidth: 200 }}>
              <h3>{inProgress ? "Pick up where you left off" : <>Ready when <em className="serif">you are.</em></>}</h3>
              <p className="small" style={{ marginTop: 4 }}>
                {sections.map(([s, n]) => `${s} ${n}`).join(" · ")}
                {!isDemo && !inProgress && !blocked && !quota.unlimited && <> · uses 1 of {quota.remaining} free this week</>}
              </p>
            </div>
            <button className="btn btn-lg btn-cream" onClick={start} disabled={busy || blocked} style={{ minWidth: 200 }}>
              {busy ? "Starting…" : inProgress ? "Resume paper" : past.length ? "Try again" : "Start paper"}
            </button>
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
          <div className="spread"><h3>Top scores</h3><Link href="/leaderboard" className="xs muted">Leaderboard</Link></div>
          {board.length === 0 ? <p className="muted small">No scores yet. Be the first!</p> : board.slice(0, 6).map((e) => (
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

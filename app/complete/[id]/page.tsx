"use client";

import { Award, Target, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Avatar } from "@/components/Avatar";
import { fetchBadges, fetchLeaderboard, fetchPointsHistory, updateProfile } from "@/lib/api";
import type { Badge, LeaderboardEntry } from "@/lib/types";

const ROW = 60;
const MAX_ROWS = 7;
const CONFETTI_COLORS = ["#58cc02", "#1cb0f6", "#ffc800", "#ff4b4b", "#ce82ff", "#ff9600"];

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 0.8, dur: 2.2 + Math.random() * 1.6,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], rot: Math.random() * 360,
  })), []);
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <i key={i} style={{ left: `${p.left}%`, background: p.color, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`, transform: `rotate(${p.rot}deg)` }} />
      ))}
    </div>
  );
}

// Your row starts at the rank you had before this paper and slides to your new rank.
function LeaderboardSlide({ entries, earned }: { entries: LeaderboardEntry[]; earned: number }) {
  const [moved, setMoved] = useState(false);
  const me = entries.find((e) => e.isYou);
  // start the slide only once the board has loaded
  useEffect(() => { if (!me) return; const t = setTimeout(() => setMoved(true), 900); return () => clearTimeout(t); }, [!!me]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!me) {
    return (
      <div className="card center stack-sm">
        <h2>Leaderboard</h2>
        <p className="muted">Your points are in. Check the leaderboard to see where you stand.</p>
        <a href="/leaderboard" className="btn btn-white btn-sm" style={{ margin: "8px auto 0" }}>Open leaderboard</a>
      </div>
    );
  }
  const others = entries.filter((e) => !e.isYou);
  const before = me.score - earned;
  const oldIdx = others.filter((o) => o.score > before || (o.score === before && earned > 0)).length;
  const newIdx = others.filter((o) => o.score > me.score).length;
  const climbed = Math.max(0, oldIdx - newIdx);

  const order = (meIdx: number) => { const list = [...others]; list.splice(meIdx, 0, me); return list; };
  const oldOrder = order(oldIdx);
  const newOrder = order(newIdx);
  const start = Math.max(0, Math.min(newIdx - 2, newOrder.length - MAX_ROWS));
  const rows = Math.min(MAX_ROWS, newOrder.length - start);
  const posOf = (list: LeaderboardEntry[], e: LeaderboardEntry) => list.indexOf(e) - start;

  return (
    <div className="card stack-sm" style={{ textAlign: "left" }}>
      <div className="spread">
        <h2>Points leaderboard</h2>
        <span className="tag tag-blue">{moved && climbed > 0 ? `Up ${climbed} place${climbed > 1 ? "s" : ""}` : `#${newIdx + 1}`}</span>
      </div>
      <div className="lb-slider" style={{ height: rows * ROW, overflow: "hidden" }}>
        {newOrder.slice(start, start + rows).concat(oldOrder.slice(start, start + rows).filter((e) => !newOrder.slice(start, start + rows).includes(e))).map((e) => {
          const pos = Math.min(rows, posOf(moved ? newOrder : oldOrder, e));
          const shownRank = (moved ? newOrder : oldOrder).indexOf(e) + 1;
          return (
            <div key={e.userId} className={`lb-row ${e.isYou ? "you" : ""}`} style={{ top: pos * ROW, height: ROW - 6 }}>
              <span className={`rank rank-${shownRank}`}>{shownRank}</span>
              <Avatar name={e.name} url={e.avatarUrl} color={e.avatarColor} size={36} />
              <span className="name">{e.isYou ? "You" : e.name}</span>
              <span className="score">{e.isYou && !moved ? before : e.score} pts</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Complete() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, attempts, testMap, earnedBadges, ready, refresh } = useApp();
  const [stage, setStage] = useState(0);
  const [earned, setEarned] = useState(0);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const attempt = attempts.find((a) => a.id === id);
  const test = attempt ? testMap[attempt.testId] : undefined;
  const isDemo = test?.kind === "demo";

  useEffect(() => {
    if (!attempt?.submittedAt) return;
    const at = new Date(attempt.submittedAt).getTime();
    fetchPointsHistory().then((l) => setEarned(l.filter((x) => Math.abs(new Date(x.created_at).getTime() - at) < 15000).reduce((s, x) => s + x.delta, 0))).catch(() => {});
    fetchLeaderboard("points", undefined, 100).then(setBoard).catch(() => {});
    fetchBadges().then(setBadges).catch(() => {});
  }, [attempt?.id, attempt?.submittedAt]);

  // finishing the warm-up completes onboarding
  useEffect(() => {
    if (isDemo && user && !user.onboarded) updateProfile(user.id, { onboarded: true }).then(refresh).catch(() => {});
  }, [isDemo, user, refresh]);

  if (!ready) return null;
  if (!attempt || !test || !attempt.submittedAt) return <div className="page muted">Loading…</div>;

  const acc = (attempt.correct ?? 0) + (attempt.wrong ?? 0) ? Math.round(((attempt.correct ?? 0) / ((attempt.correct ?? 0) + (attempt.wrong ?? 0))) * 100) : 0;
  const at = new Date(attempt.submittedAt).getTime();
  const newBadges = badges.filter((b) => earnedBadges.some((e) => e.badgeId === b.id && Math.abs(new Date(e.earnedAt).getTime() - at) < 15000));

  return (
    <div className="celebrate">
      {stage === 0 && <Confetti />}
      <div className="celebrate-inner stack">
        {stage === 0 ? (
          <>
            <div className="trophy"><Trophy size={60} /></div>
            <div>
              <h1>{isDemo ? "Warm-up complete!" : "Paper complete!"}</h1>
              <p className="muted" style={{ marginTop: 8 }}>{isDemo ? "You know the drill now. Real papers work exactly the same way." : `${test.title} is done. Nice work!`}</p>
            </div>
            <div className="reward-row">
              <div className="reward" style={{ ["--c" as string]: "var(--yellow)", animationDelay: ".3s" }}>
                <div className="h">Score</div><div className="b"><Target size={22} />{attempt.score}/{attempt.maxScore}</div>
              </div>
              <div className="reward" style={{ ["--c" as string]: "var(--green)", animationDelay: ".45s" }}>
                <div className="h">Accuracy</div><div className="b">{acc}%</div>
              </div>
              <div className="reward" style={{ ["--c" as string]: "var(--blue)", animationDelay: ".6s" }}>
                <div className="h">Points</div><div className="b"><Zap size={22} fill="currentColor" />+{earned}</div>
              </div>
            </div>
            {newBadges.length > 0 && (
              <div className="card" style={{ textAlign: "left", animation: "rise .5s .75s both" }}>
                <div className="row">
                  <span className="badge-medal" style={{ background: "var(--purple)", width: 48, height: 48, margin: 0 }}><Award size={24} /></span>
                  <div>
                    <h3>New badge{newBadges.length > 1 ? "s" : ""} unlocked</h3>
                    <p className="muted small">{newBadges.map((b) => b.name).join(", ")}</p>
                  </div>
                </div>
              </div>
            )}
            <button className="btn btn-block btn-lg" onClick={() => setStage(1)}>Continue</button>
          </>
        ) : (
          <>
            <LeaderboardSlide entries={board} earned={earned} />
            <div className="stack-sm">
              <button className="btn btn-block btn-lg" onClick={() => router.push("/papers")}>{isDemo ? "Explore papers" : "Back to papers"}</button>
              <div className="row" style={{ justifyContent: "center" }}>
                <Link href={`/results/${attempt.id}`} className="btn btn-white btn-sm">See solutions</Link>
                <Link href="/analytics" className="btn btn-white btn-sm">My dashboard</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

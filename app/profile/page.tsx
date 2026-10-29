"use client";

import { Camera, ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { AVATAR_COLORS, Avatar } from "@/components/Avatar";
import { Mark } from "@/components/Mark";
import { BadgeGrid } from "@/components/Badges";
import { IconTile } from "@/components/Icon";
import { Notice, ProMini, StatTile } from "@/components/ui";
import { fetchLeaderboard, friendlyError, updateProfile, uploadAvatar } from "@/lib/api";
import { streakDays } from "@/lib/quota";

export default function Profile() {
  const { user, attempts, earnedBadges, refresh } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rank, setRank] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchLeaderboard("points", undefined, 1).then((b) => setRank(b.find((e) => e.isYou)?.rank ?? null)).catch(() => {}); }, [user?.points]);
  if (!user) return null;

  const done = attempts.filter((a) => a.submittedAt);
  const since = new Date(attempts[attempts.length - 1]?.startedAt ?? Date.now()).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  async function save(patch: Parameters<typeof updateProfile>[1]) {
    setBusy(true); setError("");
    try { await updateProfile(user!.id, patch); await refresh(); } catch (e) { setError(friendlyError(e)); } finally { setBusy(false); }
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return setError("Please pick an image under 2 MB.");
    setBusy(true); setError("");
    try { const url = await uploadAvatar(user!.id, f); await updateProfile(user!.id, { avatar_url: url }); await refresh(); }
    catch (e) { setError(friendlyError(e)); } finally { setBusy(false); }
  }

  const answered = done.reduce((n, a) => n + (a.correct ?? 0) + (a.wrong ?? 0), 0);
  const accuracy = answered ? Math.round((done.reduce((n, a) => n + (a.correct ?? 0), 0) / answered) * 100) : null;
  const bestPct = done.length ? Math.max(...done.map((a) => Math.round(((a.score ?? 0) / (a.maxScore || 1)) * 100))) : null;
  const thisYear = new Date().getFullYear();
  const years = [0, 1, 2].map((i) => thisYear + i + (new Date().getMonth() >= 3 ? 1 : 0));
  // JEE Main session 1 usually starts in the last week of January.
  const examDay = user.targetYear ? new Date(user.targetYear, 0, 22) : null;
  const daysLeft = examDay ? Math.max(0, Math.ceil((examDay.getTime() - Date.now()) / 864e5)) : null;

  return (
    <div className="page stack">
      <div className="profile-grid">
        <aside className="id-card">
          <Mark size={220} grain className="id-mark" color="var(--cream)" />
          <div style={{ position: "relative" }}>
            <button onClick={() => fileRef.current?.click()} style={{ position: "relative", border: 0, background: "none", padding: 0, cursor: "pointer" }} aria-label="Change photo" disabled={busy}>
              <Avatar name={user.name} url={user.avatarUrl} color={user.avatarColor} size={104} />
              <span style={{ position: "absolute", right: -2, bottom: -2, width: 34, height: 34, borderRadius: "50%", background: "var(--cream)", color: "var(--ink)", display: "grid", placeItems: "center", border: "3px solid var(--ink)" }}><Camera size={16} /></span>
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => onFile(e.target.files?.[0])} />

            {editing ? (
              <form className="row" style={{ justifyContent: "center", marginTop: 16 }} onSubmit={async (e) => { e.preventDefault(); await save({ full_name: name.trim() }); setEditing(false); }}>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={40} style={{ maxWidth: 220, height: 40 }} aria-label="Name" autoFocus />
                <button className="btn btn-sm btn-cream" disabled={busy || name.trim().length < 2}>Save</button>
              </form>
            ) : (
              <div className="row" style={{ justifyContent: "center", gap: 4, marginTop: 16 }}>
                <h1>{user.name}</h1>
                <button className="btn btn-ghost btn-sm" onClick={() => { setName(user.name ?? ""); setEditing(true); }} aria-label="Edit name"><Pencil size={15} /></button>
              </div>
            )}
            <p className="muted small">{user.phone ? `+${user.phone}` : user.email}</p>

            <div className="id-facts">
              <div><div className="k">Target</div><div className="v serif">{user.targetYear ? `JEE ${user.targetYear}` : "Not set"}</div></div>
              <div><div className="k">Plan</div><div className="v serif">{user.plan === "pro" ? "Pro" : "Free"}</div></div>
              <div><div className="k">Countdown</div><div className="v">{daysLeft !== null ? `${daysLeft} days` : "–"}</div></div>
              <div><div className="k">Joined</div><div className="v">{since}</div></div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="k xs muted" style={{ marginBottom: 8 }}>Writing JEE in</div>
              <div className="year-chips">
                {years.map((y) => <button key={y} className={user.targetYear === y ? "on" : ""} onClick={() => save({ target_year: y })} disabled={busy}>{y}</button>)}
              </div>
            </div>

            <div className="color-swatches" style={{ justifyContent: "center", marginTop: 18 }}>
              {AVATAR_COLORS.map((c) => <button key={c} className={`swatch ${c === user.avatarColor ? "on" : ""}`} style={{ background: c, width: 24, height: 24 }} onClick={() => save({ avatar_color: c })} aria-label={`Colour ${c}`} />)}
            </div>
            {user.avatarUrl && <button className="btn btn-ghost btn-sm" onClick={() => save({ avatar_url: null })} style={{ marginTop: 8 }}>Remove photo</button>}
          </div>
        </aside>

        <div className="stack">
          {error && <Notice kind="red">{error}</Notice>}
          <div className="stat-tiles profile-stats">
            <StatTile solid icon="fire" value={streakDays(attempts)} label="Day streak" />
            <StatTile solid icon="bolt" value={user.points} label="Total points" />
            <StatTile solid icon="trophy" value={rank ? `#${rank}` : "–"} label="Points rank" />
            <StatTile solid icon="paper" value={done.length} label="Papers done" />
            <StatTile solid icon="target" value={accuracy !== null ? `${accuracy}%` : "–"} label="Accuracy" />
            <StatTile solid icon="rising" value={bestPct !== null ? `${bestPct}%` : "–"} label="Best score" />
          </div>

          <div className="cols-2" style={{ alignItems: "stretch" }}>
            <Link href="/analytics" className="card card-press row" style={{ gap: 14, flexWrap: "nowrap" }}>
              <IconTile name="chart" size={46} />
              <div style={{ flex: 1 }}><h3>Dashboard &amp; analytics</h3><p className="muted small">Scores, trends and subject accuracy</p></div>
              <ChevronRight size={18} className="faint" />
            </Link>
            {user.plan === "pro" ? (
              <Link href="/pro" className="card card-press row" style={{ gap: 14, flexWrap: "nowrap" }}>
                <IconTile name="crown" size={46} />
                <div style={{ flex: 1 }}><h3>Your Pro plan</h3><p className="muted small">{user.proUntil ? `Active until ${new Date(user.proUntil).toLocaleDateString("en-IN", { dateStyle: "medium" })}` : "Active"}</p></div>
              </Link>
            ) : <ProMini text="Unlimited papers and full analysis with Pro." />}
          </div>

          <section className="card" style={{ padding: 22 }}>
            <div className="spread" style={{ marginBottom: 16 }}>
              <h2>Your <em>badges</em></h2>
              <span className="muted small">{earnedBadges.length} earned</span>
            </div>
            <BadgeGrid />
          </section>
        </div>
      </div>
    </div>
  );
}

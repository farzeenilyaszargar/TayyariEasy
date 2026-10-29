"use client";

import { Camera, ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { AVATAR_COLORS, Avatar } from "@/components/Avatar";
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

  return (
    <div className="page stack">
      <div className="card" style={{ padding: 24 }}>
        <div className="row" style={{ gap: 24, alignItems: "flex-start" }}>
          <button onClick={() => fileRef.current?.click()} style={{ position: "relative", border: 0, background: "none", padding: 0, cursor: "pointer" }} aria-label="Change photo" disabled={busy}>
            <Avatar name={user.name} url={user.avatarUrl} color={user.avatarColor} size={112} />
            <span style={{ position: "absolute", right: 0, bottom: 0, width: 36, height: 36, borderRadius: "50%", background: "var(--blue)", color: "#fff", display: "grid", placeItems: "center", border: "3px solid #fff" }}><Camera size={18} /></span>
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          <div style={{ flex: 1, minWidth: 220 }} className="stack-sm">
            {editing ? (
              <form className="row" onSubmit={async (e) => { e.preventDefault(); await save({ full_name: name.trim() }); setEditing(false); }}>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={40} style={{ maxWidth: 300 }} aria-label="Name" autoFocus />
                <button className="btn btn-sm" disabled={busy || name.trim().length < 2}>Save</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              </form>
            ) : (
              <div className="row">
                <h1>{user.name}</h1>
                <button className="btn btn-ghost btn-sm" onClick={() => { setName(user.name ?? ""); setEditing(true); }} aria-label="Edit name"><Pencil size={16} /></button>
              </div>
            )}
            <p className="muted">{user.phone ? `+${user.phone}` : user.email} · Joined {since}{user.plan === "pro" && <> · <span className="tag tag-pro">Pro</span></>}</p>
            <div className="color-swatches">
              {AVATAR_COLORS.map((c) => <button key={c} className={`swatch ${c === user.avatarColor ? "on" : ""}`} style={{ background: c, width: 28, height: 28 }} onClick={() => save({ avatar_color: c })} aria-label={`Colour ${c}`} />)}
              {user.avatarUrl && <button className="btn btn-ghost btn-sm" onClick={() => save({ avatar_url: null })} style={{ color: "var(--red)" }}>Remove photo</button>}
            </div>
          </div>
        </div>
      </div>
      {error && <Notice kind="red">{error}</Notice>}

      <div className="stat-tiles">
        <StatTile icon="fire" tint="var(--tint-amber)" value={streakDays(attempts)} label="Day streak" />
        <StatTile icon="bolt" tint="var(--tint-indigo)" value={user.points} label="Total points" />
        <StatTile icon="trophy" tint="var(--tint-amber)" value={rank ? `#${rank}` : "–"} label="Points rank" />
        <StatTile icon="paper" tint="var(--tint-indigo)" value={done.length} label="Papers done" />
      </div>

      <div className="cols-2">
        <Link href="/analytics" className="card card-press row" style={{ gap: 14 }}>
          <IconTile name="chart" tint="var(--tint-blue)" size={48} />
          <div style={{ flex: 1 }}><h3>Dashboard &amp; analytics</h3><p className="muted small">Scores, trends and subject accuracy</p></div>
          <ChevronRight size={18} className="faint" />
        </Link>
        {user.plan === "pro" ? (
          <Link href="/pro" className="card card-press row" style={{ gap: 14 }}>
            <IconTile name="crown" tint="var(--tint-amber)" size={48} />
            <div style={{ flex: 1 }}><h3>Your Pro plan</h3><p className="muted small">{user.proUntil ? `Active until ${new Date(user.proUntil).toLocaleDateString("en-IN", { dateStyle: "medium" })}` : "Active"}</p></div>
          </Link>
        ) : <ProMini text="Get unlimited papers and full analysis with Pro." />}
      </div>

      <section>
        <div className="spread" style={{ marginBottom: 14 }}>
          <h2>Badges</h2>
          <span className="muted small">{earnedBadges.length} earned</span>
        </div>
        <BadgeGrid />
      </section>

    </div>
  );
}

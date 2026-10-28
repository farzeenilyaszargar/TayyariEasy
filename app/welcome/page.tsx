"use client";

import { Camera, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { AVATAR_COLORS, Avatar } from "@/components/Avatar";
import { Icon3D } from "@/components/Icon3D";
import { Notice } from "@/components/ui";
import { friendlyError, startAttempt, updateProfile, uploadAvatar } from "@/lib/api";

const STEPS = 4;

export default function Welcome() {
  const { user, refresh } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(user?.name ? 1 : 0);
  const [name, setName] = useState(user?.name ?? "");
  const [color, setColor] = useState(user?.avatarColor ?? AVATAR_COLORS[0]);
  const [photo, setPhoto] = useState<string | null>(user?.avatarUrl ?? null);
  const [year, setYear] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  if (!user) return null;
  const thisYear = new Date().getFullYear();

  async function onFile(f: File | undefined) {
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return setError("Please pick an image under 2 MB.");
    setBusy(true); setError("");
    try { setPhoto(await uploadAvatar(user!.id, f)); } catch (e) { setError(friendlyError(e)); } finally { setBusy(false); }
  }

  async function saveProfile() {
    await updateProfile(user!.id, { full_name: name.trim(), avatar_color: color, avatar_url: photo, target_year: year });
  }

  async function startDemo() {
    setBusy(true); setError("");
    try {
      await saveProfile();
      const a = await startAttempt("demo");
      await refresh();
      router.push(`/papers/demo/attempt?a=${a.id}`);
    } catch (e) {
      setError(friendlyError(e)); setBusy(false);
    }
  }

  async function skip() {
    setBusy(true);
    try {
      await saveProfile();
      await updateProfile(user!.id, { onboarded: true });
      await refresh();
      router.replace("/papers");
    } catch (e) {
      setError(friendlyError(e)); setBusy(false);
    }
  }

  const next = () => setStep((s) => Math.min(STEPS - 1, s + 1));

  return (
    <div className="page page-narrow" style={{ paddingTop: 28 }}>
      <div className="row" style={{ gap: 16, marginBottom: 28 }}>
        {step > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setStep(step - 1)} aria-label="Back" style={{ color: "var(--faint)" }}><X size={22} /></button>}
        <div className="steps-bar" style={{ flex: 1, margin: 0 }}>
          {Array.from({ length: STEPS }, (_, i) => <div key={i} className={i <= step ? "on" : ""} />)}
        </div>
      </div>

      <div className="stack" style={{ minHeight: 380 }}>
        {step === 0 && (
          <form className="stack" onSubmit={(e) => { e.preventDefault(); if (name.trim().length >= 2) next(); }}>
            <div>
              <Icon3D name="wave" size={56} style={{ marginBottom: 14 }} />
              <h1>Welcome to Tayyari. What should we call you?</h1>
              <p className="muted" style={{ marginTop: 6 }}>This is how you&apos;ll appear on leaderboards (first name and last initial).</p>
            </div>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" aria-label="Full name" autoFocus minLength={2} maxLength={40} />
            <button className="btn btn-block btn-lg" disabled={name.trim().length < 2}>Continue</button>
          </form>
        )}

        {step === 1 && (
          <div className="stack">
            <div>
              <h1>Pick your look</h1>
              <p className="muted" style={{ marginTop: 6 }}>Upload a photo or choose a colour.</p>
            </div>
            <div className="row" style={{ gap: 24 }}>
              <button onClick={() => fileRef.current?.click()} style={{ position: "relative", border: 0, background: "none", padding: 0, cursor: "pointer" }} aria-label="Upload photo">
                <Avatar name={name} url={photo} color={color} size={112} />
                <span style={{ position: "absolute", right: 0, bottom: 0, width: 36, height: 36, borderRadius: "50%", background: "var(--blue)", color: "#fff", display: "grid", placeItems: "center", border: "3px solid #fff" }}><Camera size={18} /></span>
              </button>
              <div className="stack-sm">
                <div className="color-swatches">
                  {AVATAR_COLORS.map((c) => <button key={c} className={`swatch ${c === color ? "on" : ""}`} style={{ background: c }} onClick={() => setColor(c)} aria-label={`Colour ${c}`} />)}
                </div>
                <div className="row">
                  <button className="btn btn-white btn-sm" onClick={() => fileRef.current?.click()} disabled={busy}>{busy ? "Uploading…" : "Upload photo"}</button>
                  {photo && <button className="btn btn-ghost btn-sm" onClick={() => setPhoto(null)} style={{ color: "var(--red)" }}>Remove</button>}
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            </div>
            <button className="btn btn-block btn-lg" onClick={next} disabled={busy}>Continue</button>
          </div>
        )}

        {step === 2 && (
          <div className="stack">
            <div>
              <Icon3D name="calendar" size={56} style={{ marginBottom: 14 }} />
              <h1>When are you writing JEE?</h1>
              <p className="muted" style={{ marginTop: 6 }}>We&apos;ll use this to pace your practice.</p>
            </div>
            <div className="stack-sm">
              {[0, 1, 2].map((i) => (
                <button key={i} className={`option ${year === thisYear + i ? "selected" : ""}`} onClick={() => setYear(thisYear + i)}>
                  <span className="key">{i + 1}</span>JEE {thisYear + i}
                </button>
              ))}
            </div>
            <button className="btn btn-block btn-lg" onClick={next} disabled={!year}>Continue</button>
          </div>
        )}

        {step === 3 && (
          <div className="stack center">
            <div style={{ display: "grid", placeItems: "center", filter: "drop-shadow(0 18px 22px rgba(16,24,40,.18))" }}><Icon3D name="memo" size={120} /></div>
            <div>
              <h1>Ready for a quick warm-up, {name.split(" ")[0]}?</h1>
              <p className="muted" style={{ marginTop: 8 }}>A 4-question paper to show you how the test screen works. It doesn&apos;t count toward your weekly papers.</p>
            </div>
            <div className="stack-sm" style={{ maxWidth: 360, margin: "28px auto 0" }}>
              <button className="btn btn-block btn-lg" onClick={startDemo} disabled={busy}>{busy ? "Starting…" : "Start warm-up"}</button>
              <button className="btn btn-ghost btn-block" onClick={skip} disabled={busy}>Skip for now</button>
            </div>
          </div>
        )}

        {error && <Notice kind="red">{error}</Notice>}
      </div>
    </div>
  );
}

"use client";

import { Clock, X } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { IconTile } from "@/components/Icon";
import { fetchAttempt, friendlyError, saveProgress, submitAttempt } from "@/lib/api";
import { SUBJECTS } from "@/lib/scoring";
import type { AnswerRecord, Attempt } from "@/lib/types";

type Answers = Record<string, AnswerRecord>;
const blank = (): AnswerRecord => ({ response: null, timeSec: 0, markedForReview: false, visited: false });
const totalTime = (a: Answers) => Object.values(a).reduce((s, r) => s + (r.timeSec ?? 0), 0);
const localKey = (id: string) => `tayyari:attempt:${id}`;

// Shown one at a time during the warm-up paper.
const TIPS = [
  "Tap an option to answer. You can change it any time before submitting.",
  "Not sure? Use “Mark for review” to come back later. Marked answers still count.",
  "The palette shows every question: green is answered, red is skipped, purple is marked.",
  "Numerical questions need a typed number. Wrong answers cost 1 mark, so skip if you're guessing.",
  "When you're done, hit Submit. Your score and rank appear right away.",
];

function statusOf(a: AnswerRecord | undefined) {
  if (!a || !a.visited) return "";
  const answered = a.response !== null;
  if (a.markedForReview) return answered ? "answered-marked" : "marked";
  return answered ? "answered" : "notanswered";
}

function Exam() {
  const { id } = useParams<{ id: string }>();
  const attemptId = useSearchParams().get("a");
  const router = useRouter();
  const { refresh, testMap, questionMap, ready } = useApp();
  const test = testMap[id];
  const isDemo = test?.kind === "demo";

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [idx, setIdx] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [numDraft, setNumDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [tip, setTip] = useState(0);
  const [error, setError] = useState("");
  const answersRef = useRef<Answers>({});
  const submittedRef = useRef(false);
  answersRef.current = answers;

  useEffect(() => {
    if (!attemptId) return router.replace(`/papers/${id}`);
    fetchAttempt(attemptId).then((a) => {
      if (!a || a.testId !== id) return router.replace(`/papers/${id}`);
      if (a.submittedAt) return router.replace(`/complete/${a.id}`);
      let local: Answers | null = null;
      try { local = JSON.parse(localStorage.getItem(localKey(a.id)) ?? "null"); } catch { /* ignore */ }
      setAnswers(local && totalTime(local) > totalTime(a.answers) ? local : a.answers);
      setAttempt(a);
    }).catch((e) => setError(friendlyError(e)));
  }, [attemptId, id, router]);

  const qid = test?.questionIds[idx];
  const q = qid ? questionMap[qid] : undefined;

  const patch = useCallback((questionId: string, p: Partial<AnswerRecord>) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...(prev[questionId] ?? blank()), ...p } }));
  }, []);

  useEffect(() => {
    if (!attempt || !qid) return;
    patch(qid, { visited: true });
    const r = answersRef.current[qid]?.response;
    setNumDraft(r === null || r === undefined ? "" : String(r));
  }, [qid, attempt, patch]);

  useEffect(() => {
    if (!attempt || !qid) return;
    const t = setInterval(() => {
      setNow(Date.now());
      setAnswers((prev) => {
        const rec = prev[qid] ?? blank();
        const next = { ...prev, [qid]: { ...rec, timeSec: rec.timeSec + 1 } };
        try { localStorage.setItem(localKey(attempt.id), JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [attempt, qid]);

  useEffect(() => {
    if (!attempt) return;
    const sync = () => { if (!submittedRef.current) saveProgress(attempt.id, answersRef.current).catch(() => {}); };
    const t = setInterval(sync, 15000);
    const onHide = () => document.visibilityState === "hidden" && sync();
    document.addEventListener("visibilitychange", onHide);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onHide); };
  }, [attempt]);

  const submit = useCallback(async () => {
    if (!attempt || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await submitAttempt(attempt.id, answersRef.current);
      try { localStorage.removeItem(localKey(attempt.id)); } catch { /* ignore */ }
      await refresh();
      router.replace(`/complete/${attempt.id}`);
    } catch (e) {
      submittedRef.current = false;
      setSubmitting(false);
      setError(friendlyError(e));
    }
  }, [attempt, refresh, router]);

  const endsAt = attempt && test ? new Date(attempt.startedAt).getTime() + test.durationMin * 60_000 : Infinity;
  const left = Math.max(0, Math.floor((endsAt - now) / 1000));
  useEffect(() => { if (attempt && left === 0) submit(); }, [attempt, left, submit]);

  if (error && !attempt) return <div className="page"><div className="notice notice-red">{error}</div></div>;
  if (!ready || !test || !attempt || !q) return <div className="page muted">Loading paper…</div>;

  const rec = answers[q.id];
  const answeredCount = test.questionIds.filter((x) => answers[x]?.response != null).length;
  const go = (i: number) => setIdx(Math.max(0, Math.min(test.questionIds.length - 1, i)));
  const commitNumerical = () => {
    if (q.type !== "numerical") return;
    const v = numDraft.trim() === "" ? null : Number(numDraft);
    patch(q.id, { response: v !== null && Number.isFinite(v) ? v : null });
  };
  const sections = SUBJECTS.filter((s) => test.questionIds.some((x) => questionMap[x]?.subject === s));
  const isLast = idx === test.questionIds.length - 1;

  return (
    <div className="exam">
      <div className="exam-top">
        <div className="row" style={{ gap: 16, flexWrap: "nowrap" }}>
          <button className="btn btn-ghost btn-sm" aria-label="Exit" style={{ color: "var(--faint)", padding: "0 6px" }}
            onClick={() => { saveProgress(attempt.id, answersRef.current).catch(() => {}); router.push(isDemo ? "/welcome" : `/papers/${id}`); }}>
            <X size={26} />
          </button>
          <div className="progress-track"><div style={{ width: `${(answeredCount / test.questionIds.length) * 100}%` }} /></div>
          <span className={`timer ${left < 300 && !isDemo ? "low" : ""}`}><Clock size={18} />{String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}</span>
          <button className="btn btn-sm" disabled={submitting} onClick={() => { commitNumerical(); setConfirming(true); }}>
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
        {sections.length > 1 && (
          <div className="chips" style={{ marginTop: 10 }}>
            {sections.map((s) => (
              <button key={s} className={`chip-btn ${q.subject === s ? "active" : ""}`} style={{ height: 34 }}
                onClick={() => { commitNumerical(); go(test.questionIds.findIndex((x) => questionMap[x]?.subject === s)); }}>{s}</button>
            ))}
          </div>
        )}
      </div>

      <div className="exam-body">
        <div className="stack-sm">
          {isDemo && tip < TIPS.length && (
            <div className="coach">
              <IconTile name="bulb" tint="var(--tint-amber)" size={36} />
              <span style={{ flex: 1 }}>{TIPS[tip]}</span>
              <button className="btn btn-yellow btn-sm" onClick={() => setTip(tip + 1)}>{tip === TIPS.length - 1 ? "Got it" : "Next tip"}</button>
            </div>
          )}
          {error && <div className="notice notice-red">{error}</div>}

          <div className="card">
            <div className="spread">
              <span className="upper muted">Question {idx + 1} of {test.questionIds.length}</span>
              <div className="row" style={{ gap: 6 }}>
                <span className={`tag ${q.type === "mcq" ? "tag-blue" : "tag-purple"}`}>{q.type === "mcq" ? "Single correct" : "Numerical"}</span>
                <span className="tag tag-green">+4</span><span className="tag tag-red">−1</span>
              </div>
            </div>
            <div className="q-text">{q.text}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {q.imageUrl && <img src={q.imageUrl} alt="Question diagram" style={{ maxWidth: "100%", marginBottom: 16, borderRadius: 12 }} />}

            {q.type === "mcq" ? (
              (q.options ?? []).map((opt, i) => (
                <button key={i} className={`option ${rec?.response === i ? "selected" : ""}`} onClick={() => patch(q.id, { response: i })}>
                  <span className="key">{String.fromCharCode(65 + i)}</span>{opt}
                </button>
              ))
            ) : (
              <div style={{ maxWidth: 280 }}>
                <input type="number" step="any" value={numDraft} onChange={(e) => setNumDraft(e.target.value)} onBlur={commitNumerical} placeholder="Type your answer" aria-label="Your answer" />
              </div>
            )}
          </div>

          <div className="spread">
            <div className="row">
              <button className="btn btn-white btn-sm" onClick={() => { commitNumerical(); go(idx - 1); }} disabled={idx === 0}>Previous</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setNumDraft(""); patch(q.id, { response: null }); }}>Clear</button>
            </div>
            <div className="row">
              <button className="btn btn-white btn-sm" onClick={() => { commitNumerical(); patch(q.id, { markedForReview: !rec?.markedForReview }); if (!isLast) go(idx + 1); }}>
                {rec?.markedForReview ? "Unmark" : "Mark for review"}
              </button>
              <button className="btn btn-sm" onClick={() => { commitNumerical(); if (isLast) setConfirming(true); else go(idx + 1); }}>
                {isLast ? "Finish" : "Save & next"}
              </button>
            </div>
          </div>
        </div>

        <aside className="card stack-sm">
          <h3>Questions</h3>
          <div className="palette">
            {test.questionIds.map((x, i) => (
              <button key={x} className={`pal ${statusOf(answers[x])} ${i === idx ? "current" : ""}`} onClick={() => { commitNumerical(); go(i); }}>{i + 1}</button>
            ))}
          </div>
          <div className="legend">
            <span style={{ ["--c" as string]: "var(--green)" }}>Answered</span>
            <span style={{ ["--c" as string]: "var(--red-soft)" }}>Skipped</span>
            <span style={{ ["--c" as string]: "#fff" }}>Not visited</span>
            <span style={{ ["--c" as string]: "var(--purple)" }}>Marked</span>
          </div>
        </aside>
      </div>

      {confirming && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 16 }}>
          <div className="card stack-sm center" style={{ maxWidth: 380, width: "100%" }}>
            <h2>Submit this paper?</h2>
            <p className="muted">You&apos;ve answered {answeredCount} of {test.questionIds.length} questions. You can&apos;t change answers after submitting.</p>
            <button className="btn btn-block" onClick={() => { setConfirming(false); submit(); }}>Submit</button>
            <button className="btn btn-ghost btn-block" onClick={() => setConfirming(false)}>Keep going</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AttemptPage() {
  return <Suspense fallback={<div className="page muted">Loading…</div>}><Exam /></Suspense>;
}

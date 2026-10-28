"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { fetchAttempt, friendlyError, saveProgress, submitAttempt } from "@/lib/api";
import { SUBJECTS } from "@/lib/scoring";
import type { AnswerRecord, Attempt } from "@/lib/types";

type Answers = Record<string, AnswerRecord>;
const blank = (): AnswerRecord => ({ response: null, timeSec: 0, markedForReview: false, visited: false });
const totalTime = (a: Answers) => Object.values(a).reduce((s, r) => s + (r.timeSec ?? 0), 0);
const localKey = (id: string) => `tayyari:attempt:${id}`;

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

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [idx, setIdx] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [numDraft, setNumDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const answersRef = useRef<Answers>({});
  const submittedRef = useRef(false);
  answersRef.current = answers;

  // load attempt (prefer the local copy if it is further along, e.g. after a network blip)
  useEffect(() => {
    if (!attemptId) return router.replace(`/tests/${id}`);
    fetchAttempt(attemptId).then((a) => {
      if (!a || a.testId !== id) return router.replace(`/tests/${id}`);
      if (a.submittedAt) return router.replace(`/results/${a.id}`);
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

  // mark visited + load numerical draft when switching question
  useEffect(() => {
    if (!attempt || !qid) return;
    patch(qid, { visited: true });
    const r = answersRef.current[qid]?.response;
    setNumDraft(r === null || r === undefined ? "" : String(r));
  }, [qid, attempt, patch]);

  // clock: time on current question + local backup every second
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

  // server sync every 15s and when the tab is hidden
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
      router.replace(`/results/${attempt.id}`);
    } catch (e) {
      submittedRef.current = false;
      setSubmitting(false);
      setError(friendlyError(e));
    }
  }, [attempt, refresh, router]);

  const endsAt = attempt && test ? new Date(attempt.startedAt).getTime() + test.durationMin * 60_000 : Infinity;
  const left = Math.max(0, Math.floor((endsAt - now) / 1000));
  useEffect(() => { if (attempt && left === 0) submit(); }, [attempt, left, submit]);

  if (error && !attempt) return <div className="container page"><div className="banner">{error}</div></div>;
  if (!ready || !test || !attempt || !q) return <div className="container page muted">Loading test…</div>;

  const rec = answers[q.id];
  const answeredCount = test.questionIds.filter((x) => answers[x]?.response != null).length;
  const go = (i: number) => setIdx(Math.max(0, Math.min(test.questionIds.length - 1, i)));
  const commitNumerical = () => {
    if (q.type !== "numerical") return;
    const v = numDraft.trim() === "" ? null : Number(numDraft);
    patch(q.id, { response: v !== null && Number.isFinite(v) ? v : null });
  };
  const sections = SUBJECTS.filter((s) => test.questionIds.some((x) => questionMap[x]?.subject === s));

  return (
    <div className="exam">
      <div className="exam-top">
        <div className="spread">
          <div><b>{test.title}</b> <span className="muted small">· {answeredCount}/{test.questionIds.length} answered</span></div>
          <div className="row">
            <span className={`timer ${left < 300 ? "low" : ""}`}>⏱ {String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}</span>
            <button className="btn btn-sm btn-green" disabled={submitting}
              onClick={() => { commitNumerical(); if (confirm("Submit the test? You can't change answers after this.")) submit(); }}>
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </div>
        {sections.length > 1 && (
          <div className="tabs" style={{ marginTop: 10 }}>
            {sections.map((s) => (
              <button key={s} className={`tab ${q.subject === s ? "active" : ""}`}
                onClick={() => { commitNumerical(); go(test.questionIds.findIndex((x) => questionMap[x]?.subject === s)); }}>{s}</button>
            ))}
          </div>
        )}
        {error && <div className="banner" style={{ marginTop: 10 }}>{error}</div>}
      </div>

      <div className="exam-body">
        <div className="card">
          <div className="spread">
            <b>Question {idx + 1}</b>
            <div className="row small">
              <span className="chip chip-gray">{q.type === "mcq" ? "Single correct" : "Numerical"}</span>
              <span className="chip chip-green">+4</span><span className="chip chip-red">−1</span>
            </div>
          </div>
          <div className="q-text">{q.text}</div>
          {q.imageUrl && <img src={q.imageUrl} alt="Question diagram" style={{ maxWidth: "100%", marginBottom: 16, borderRadius: 8 }} />}

          {q.type === "mcq" ? (
            (q.options ?? []).map((opt, i) => (
              <button key={i} className={`option ${rec?.response === i ? "selected" : ""}`} onClick={() => patch(q.id, { response: i })}>
                <span className="key">{String.fromCharCode(65 + i)}</span>{opt}
              </button>
            ))
          ) : (
            <div style={{ maxWidth: 260 }}>
              <label htmlFor="num">Your answer</label>
              <input id="num" type="number" step="any" value={numDraft} onChange={(e) => setNumDraft(e.target.value)} onBlur={commitNumerical} placeholder="Enter a number" />
            </div>
          )}

          <div className="spread" style={{ marginTop: 24 }}>
            <div className="row">
              <button className="btn btn-ghost btn-sm" onClick={() => { commitNumerical(); go(idx - 1); }} disabled={idx === 0}>← Previous</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setNumDraft(""); patch(q.id, { response: null }); }}>Clear response</button>
            </div>
            <div className="row">
              <button className="btn btn-sm btn-purple"
                onClick={() => { commitNumerical(); patch(q.id, { markedForReview: !rec?.markedForReview }); go(idx + 1); }}>
                {rec?.markedForReview ? "Unmark" : "Mark for review"} & Next
              </button>
              <button className="btn btn-sm" onClick={() => { commitNumerical(); go(idx + 1); }}>Save & Next →</button>
            </div>
          </div>
        </div>

        <aside className="card stack">
          <b>Question palette</b>
          <div className="palette">
            {test.questionIds.map((x, i) => (
              <button key={x} className={`pal ${statusOf(answers[x])} ${i === idx ? "current" : ""}`} onClick={() => { commitNumerical(); go(i); }}>{i + 1}</button>
            ))}
          </div>
          <div className="legend">
            <span style={{ ["--c" as string]: "var(--green)" }}>Answered</span>
            <span style={{ ["--c" as string]: "var(--red)" }}>Not answered</span>
            <span style={{ ["--c" as string]: "#fff" }}>Not visited</span>
            <span style={{ ["--c" as string]: "var(--purple)" }}>Marked</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function AttemptPage() {
  return <Suspense fallback={<div className="container page muted">Loading…</div>}><Exam /></Suspense>;
}

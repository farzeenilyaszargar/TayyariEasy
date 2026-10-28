"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { QUESTION_MAP } from "@/data/questions";
import { TEST_MAP } from "@/data/tests";
import { scoreAttempt, SUBJECTS } from "@/lib/scoring";
import { store } from "@/lib/store";
import type { AnswerRecord, Attempt } from "@/lib/types";

const blank = (questionId: string): AnswerRecord => ({ questionId, response: null, timeSec: 0, markedForReview: false, visited: false });

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
  const { refresh } = useApp();
  const test = TEST_MAP[id];

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [idx, setIdx] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [numDraft, setNumDraft] = useState("");
  const submittedRef = useRef(false);

  useEffect(() => {
    const a = attemptId ? store.getAttempt(attemptId) : undefined;
    if (!a || a.testId !== id) return router.replace(`/tests/${id}`);
    if (a.submittedAt) return router.replace(`/results/${a.id}`);
    setAttempt(a);
  }, [attemptId, id, router]);

  const qid = test?.questionIds[idx];
  const q = qid ? QUESTION_MAP[qid] : undefined;

  const update = useCallback((fn: (a: Attempt) => Attempt) => {
    setAttempt((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      store.saveAttempt(next);
      return next;
    });
  }, []);

  const patch = useCallback((questionId: string, p: Partial<AnswerRecord>) => {
    update((a) => ({ ...a, answers: { ...a.answers, [questionId]: { ...(a.answers[questionId] ?? blank(questionId)), ...p } } }));
  }, [update]);

  // mark visited + load numerical draft when switching question
  useEffect(() => {
    if (!attempt || !qid) return;
    patch(qid, { visited: true });
    const r = attempt.answers[qid]?.response;
    setNumDraft(r === null || r === undefined ? "" : String(r));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qid, !!attempt]);

  const submit = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const current = store.getAttempt(attemptId!);
    if (!current) return;
    const final = { ...current, submittedAt: new Date().toISOString(), ...scoreAttempt(current) };
    store.saveAttempt(final);
    refresh();
    router.replace(`/results/${final.id}`);
  }, [attemptId, refresh, router]);

  // clock: count time on current question, auto-submit at zero
  useEffect(() => {
    if (!attempt || !qid) return;
    const t = setInterval(() => {
      setNow(Date.now());
      update((a) => {
        const rec = a.answers[qid] ?? blank(qid);
        return { ...a, answers: { ...a.answers, [qid]: { ...rec, timeSec: rec.timeSec + 1 } } };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [attempt?.id, qid, update]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!test || !attempt || !q) return <div className="container page muted">Loading test…</div>;

  const endsAt = new Date(attempt.startedAt).getTime() + test.durationMin * 60_000;
  const left = Math.max(0, Math.floor((endsAt - now) / 1000));
  if (left === 0 && !submittedRef.current) setTimeout(submit, 0);
  const rec = attempt.answers[q.id];
  const answeredCount = test.questionIds.filter((x) => attempt.answers[x]?.response != null).length;

  const go = (i: number) => setIdx(Math.max(0, Math.min(test.questionIds.length - 1, i)));
  const commitNumerical = () => {
    if (q.type !== "numerical") return;
    const v = numDraft.trim() === "" ? null : Number(numDraft);
    patch(q.id, { response: v !== null && Number.isFinite(v) ? v : null });
  };
  const sections = SUBJECTS.filter((s) => test.questionIds.some((x) => QUESTION_MAP[x].subject === s));

  return (
    <div className="exam">
      <div className="exam-top">
        <div className="spread">
          <div><b>{test.title}</b> <span className="muted small">· {answeredCount}/{test.questionIds.length} answered</span></div>
          <div className="row">
            <span className={`timer ${left < 300 ? "low" : ""}`}>⏱ {String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}</span>
            <button className="btn btn-sm btn-green" onClick={() => confirm("Submit the test? You can't change answers after this.") && submit()}>Submit</button>
          </div>
        </div>
        {sections.length > 1 && (
          <div className="tabs" style={{ marginTop: 10 }}>
            {sections.map((s) => (
              <button key={s} className={`tab ${q.subject === s ? "active" : ""}`}
                onClick={() => go(test.questionIds.findIndex((x) => QUESTION_MAP[x].subject === s))}>{s}</button>
            ))}
          </div>
        )}
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

          {q.type === "mcq" ? (
            q.options!.map((opt, i) => (
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
              <button className="btn btn-sm" style={{ background: "var(--purple)", borderColor: "var(--purple)" }}
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
              <button key={x} className={`pal ${statusOf(attempt.answers[x])} ${i === idx ? "current" : ""}`} onClick={() => { commitNumerical(); go(i); }}>{i + 1}</button>
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

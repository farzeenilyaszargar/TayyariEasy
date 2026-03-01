"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { submitBlueprintTest, type TestInstanceRow } from "@/lib/supabase-db";

type ExamSession = TestInstanceRow & { launchedAt: number };

type SubmitResult = {
  score: number;
  maxScore: number;
  percentile: number;
  correctCount: number;
  attemptedCount: number;
  totalQuestions: number;
  topicBreakdown: Array<{ topic: string; attempted: number; correct: number; accuracy: number }>;
  difficultyBreakdown: Array<{ difficulty: string; attempted: number; correct: number; accuracy: number }>;
};

type QuestionStatus = "not_visited" | "not_answered" | "answered" | "marked" | "answered_marked";

function normalizeSubject(subject: string) {
  if (subject === "Mathematics") {
    return "Math";
  }
  return subject;
}

export default function MockExamPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();

  const [session, setSession] = useState<ExamSession | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [lang, setLang] = useState("English");
  const [remainingSec, setRemainingSec] = useState(0);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    const raw = window.sessionStorage.getItem("tayyari-active-test");
    if (!raw) {
      setSession(null);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as ExamSession;
      setSession(parsed);
      if (parsed.questions.length > 0) {
        setVisited({ [parsed.questions[0].id]: true });
      }
      const total = parsed.blueprint.durationMinutes * 60;
      const elapsed = Math.max(0, Math.floor((Date.now() - (parsed.launchedAt || Date.now())) / 1000));
      setRemainingSec(Math.max(0, total - elapsed));
    } catch {
      setSession(null);
    }
  }, []);

  useEffect(() => {
    if (!session || remainingSec <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setRemainingSec((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [session, remainingSec]);

  useEffect(() => {
    if (remainingSec === 0 && session && !result && !submitting) {
      void onSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSec, session]);

  const current = session?.questions[currentIdx] || null;

  const questionStatusMap = useMemo(() => {
    const map = new Map<string, QuestionStatus>();
    if (!session) {
      return map;
    }

    for (const question of session.questions) {
      const qid = question.id;
      const hasAnswer = (answers[qid] || "").trim().length > 0;
      const isMarked = Boolean(marked[qid]);
      const isVisited = Boolean(visited[qid]);

      let status: QuestionStatus = "not_visited";
      if (hasAnswer && isMarked) {
        status = "answered_marked";
      } else if (isMarked) {
        status = "marked";
      } else if (hasAnswer) {
        status = "answered";
      } else if (isVisited) {
        status = "not_answered";
      }
      map.set(qid, status);
    }

    return map;
  }, [session, answers, marked, visited]);

  const counts = useMemo(() => {
    const base = {
      not_visited: 0,
      not_answered: 0,
      answered: 0,
      marked: 0,
      answered_marked: 0
    };
    questionStatusMap.forEach((value) => {
      base[value] += 1;
    });
    return base;
  }, [questionStatusMap]);

  const questionsBySubject = useMemo(() => {
    if (!session) {
      return [] as Array<{ subject: string; count: number }>;
    }
    const bucket = new Map<string, number>();
    for (const q of session.questions) {
      const currentCount = bucket.get(q.subject) || 0;
      bucket.set(q.subject, currentCount + 1);
    }
    return Array.from(bucket.entries()).map(([subject, count]) => ({ subject, count }));
  }, [session]);

  const moveTo = (idx: number) => {
    if (!session) {
      return;
    }
    const next = Math.max(0, Math.min(session.questions.length - 1, idx));
    const qid = session.questions[next]?.id;
    if (qid) {
      setVisited((prev) => ({ ...prev, [qid]: true }));
    }
    setCurrentIdx(next);
  };

  const goNext = () => moveTo(currentIdx + 1);
  const goPrev = () => moveTo(currentIdx - 1);

  const saveAndNext = () => {
    if (!current) {
      return;
    }
    setVisited((prev) => ({ ...prev, [current.id]: true }));
    setMarked((prev) => ({ ...prev, [current.id]: false }));
    goNext();
  };

  const saveAndMarkReview = () => {
    if (!current) {
      return;
    }
    setVisited((prev) => ({ ...prev, [current.id]: true }));
    setMarked((prev) => ({ ...prev, [current.id]: true }));
  };

  const markForReviewAndNext = () => {
    if (!current) {
      return;
    }
    setVisited((prev) => ({ ...prev, [current.id]: true }));
    setMarked((prev) => ({ ...prev, [current.id]: true }));
    goNext();
  };

  const clearResponse = () => {
    if (!current) {
      return;
    }
    setAnswers((prev) => ({ ...prev, [current.id]: "" }));
    setMarked((prev) => ({ ...prev, [current.id]: false }));
    setVisited((prev) => ({ ...prev, [current.id]: true }));
  };

  const onSubmit = async () => {
    if (!session || submitting || result) {
      return;
    }

    if (!isLoggedIn) {
      setSubmitError("Please login first to submit and save your result.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const payload: Record<string, string | number> = {};

      for (const question of session.questions) {
        const raw = (answers[question.id] || "").trim();
        if (!raw) {
          continue;
        }

        if (question.questionType === "integer") {
          const numeric = Number(raw);
          if (Number.isFinite(numeric)) {
            payload[question.id] = numeric;
          }
        } else {
          payload[question.id] = raw.toUpperCase();
        }
      }

      const res = await submitBlueprintTest({
        testInstanceId: session.testInstanceId,
        answers: payload,
        timeTakenSeconds: session.blueprint.durationMinutes * 60 - remainingSec
      });

      setResult(res);
      window.sessionStorage.removeItem("tayyari-active-test");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit test.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (!session) {
    return (
      <section className="page">
        <article className="card">
          <h2>No Active Test Session</h2>
          <p className="muted">Start a test from the Tests page first.</p>
          <div className="cta-row">
            <Link className="btn btn-solid" href="/tests">
              Go to Tests
            </Link>
          </div>
        </article>
      </section>
    );
  }

  if (result) {
    return (
      <section className="page nta-result-page">
        <article className="card nta-result-card">
          <h2>Test Submitted Successfully</h2>
          <p className="muted">Candidate: {user.name}</p>
          <p className="muted">
            Score: {result.score} / {result.maxScore} | Percentile: {result.percentile}
          </p>
          <p className="muted">
            Correct: {result.correctCount} | Attempted: {result.attemptedCount} / {result.totalQuestions}
          </p>

          <div className="grid-2">
            <article className="card">
              <h4>Topic Accuracy</h4>
              <ul className="list-clean">
                {result.topicBreakdown.map((item) => (
                  <li key={item.topic}>
                    <span>{item.topic}</span>
                    <strong>{item.accuracy}%</strong>
                  </li>
                ))}
              </ul>
            </article>
            <article className="card">
              <h4>Difficulty Accuracy</h4>
              <ul className="list-clean">
                {result.difficultyBreakdown.map((item) => (
                  <li key={item.difficulty}>
                    <span>{item.difficulty}</span>
                    <strong>{item.accuracy}%</strong>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="cta-row">
            <button className="btn btn-solid" onClick={() => router.push("/tests")}>Back to Tests</button>
            <button className="btn btn-outline" onClick={() => router.push("/")}>Go Home</button>
          </div>
        </article>
      </section>
    );
  }

  if (!current) {
    return (
      <section className="page">
        <article className="card">
          <h2>No Questions Available</h2>
          <p className="muted">This test instance has no questions. Please launch another test.</p>
          <div className="cta-row">
            <button className="btn btn-solid" onClick={() => router.push("/tests")}>
              Back to Tests
            </button>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="nta-page">
      <div className="nta-shell">
        <header className="nta-topbar">
          <div className="nta-brand">
            <strong>TAYYARI MOCK TEST</strong>
            <small>Exam-like interface for realistic practice</small>
          </div>
          <div className="nta-candidate">
            <p>Candidate: <strong>{user.name || "Aspirant"}</strong></p>
            <p>Test: <strong>{session.blueprint.name}</strong></p>
            <p>Remaining Time: <strong>{formatTime(remainingSec)}</strong></p>
          </div>
        </header>

        <div className="nta-subject-row">
          {questionsBySubject.map((item) => (
            <button
              key={item.subject}
              className={`nta-subject-pill ${current?.subject === item.subject ? "active" : ""}`}
              onClick={() => {
                const first = session.questions.findIndex((q) => q.subject === item.subject);
                if (first >= 0) {
                  moveTo(first);
                }
              }}
            >
              {normalizeSubject(item.subject)} ({item.count})
            </button>
          ))}
          <div className="nta-lang-wrap">
            <label htmlFor="nta-lang">Language</label>
            <select id="nta-lang" value={lang} onChange={(event) => setLang(event.target.value)}>
              <option>English</option>
            </select>
          </div>
        </div>

        <div className="nta-main">
          <article className="nta-question-card">
            <div className="nta-question-head">
              <h3>Question {currentIdx + 1}</h3>
              <p className="muted">
                {current.subject} • {current.topic} • {current.difficulty}
              </p>
            </div>

            <div className="nta-question-body">
              <p>{current.stemMarkdown}</p>
              {current.questionType === "mcq_single" ? (
                <div className="nta-options">
                  {current.options.map((option) => {
                    const selected = (answers[current.id] || "").toUpperCase() === option.key;
                    return (
                      <button
                        type="button"
                        key={option.key}
                        className={`nta-option ${selected ? "active" : ""}`}
                        onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: option.key }))}
                      >
                        <span>{option.key}</span>
                        <span>{option.text}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="nta-integer-wrap">
                  <label htmlFor="nta-int-answer">Integer Answer</label>
                  <input
                    id="nta-int-answer"
                    type="number"
                    value={answers[current.id] || ""}
                    onChange={(event) => setAnswers((prev) => ({ ...prev, [current.id]: event.target.value }))}
                    placeholder="Enter integer answer"
                  />
                </div>
              )}
            </div>

            <div className="nta-actions-top">
              <button className="btn nta-btn-save" onClick={saveAndNext}>Save & Next</button>
              <button className="btn nta-btn-mark" onClick={saveAndMarkReview}>Save & Mark For Review</button>
              <button className="btn nta-btn-clear" onClick={clearResponse}>Clear Response</button>
              <button className="btn nta-btn-nextmark" onClick={markForReviewAndNext}>Mark For Review & Next</button>
            </div>

            <div className="nta-actions-bottom">
              <button className="btn btn-outline" onClick={goPrev} disabled={currentIdx === 0}>
                &lt;&lt; Back
              </button>
              <button className="btn btn-outline" onClick={goNext} disabled={currentIdx >= session.questions.length - 1}>
                Next &gt;&gt;
              </button>
              <button className="btn btn-solid nta-submit-btn" onClick={() => void onSubmit()} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
            {submitError ? <p className="muted">{submitError}</p> : null}
          </article>

          <aside className="nta-sidebar">
            <div className="nta-status-legend">
              <div className="nta-status-row">
                <span className="nta-chip not-visited">{counts.not_visited}</span>
                <span>Not Visited</span>
              </div>
              <div className="nta-status-row">
                <span className="nta-chip not-answered">{counts.not_answered}</span>
                <span>Not Answered</span>
              </div>
              <div className="nta-status-row">
                <span className="nta-chip answered">{counts.answered}</span>
                <span>Answered</span>
              </div>
              <div className="nta-status-row">
                <span className="nta-chip marked">{counts.marked}</span>
                <span>Marked For Review</span>
              </div>
              <div className="nta-status-row">
                <span className="nta-chip answered-marked">{counts.answered_marked}</span>
                <span>Answered & Marked</span>
              </div>
            </div>

            <div className="nta-question-palette">
              {session.questions.map((question, idx) => {
                const status = questionStatusMap.get(question.id) || "not_visited";
                return (
                  <button
                    key={question.id}
                    className={`nta-qbtn ${status} ${idx === currentIdx ? "active" : ""}`}
                    onClick={() => moveTo(idx)}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

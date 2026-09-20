"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { TrophyIcon, TrendIcon } from "@/components/ui-icons";
import { useAuth } from "@/components/auth-provider";
import { fetchTestInstanceById, launchBlueprintTest, submitBlueprintTest, type TestInstanceRow } from "@/lib/supabase-db";
import { LOCAL_TEST_ID } from "@/lib/local-test";

type ExamSession = TestInstanceRow & { launchedAt: number };

type SubmitResult = {
  unscored?: boolean;
  score: number;
  maxScore: number;
  earnedPoints: number;
  percentile: number;
  correctCount: number;
  attemptedCount: number;
  totalQuestions: number;
  savedToCloud?: boolean;
  topicBreakdown: Array<{ topic: string; attempted: number; correct: number; accuracy: number }>;
  difficultyBreakdown: Array<{ difficulty: string; attempted: number; correct: number; accuracy: number }>;
};

type LocalAttempt = {
  id: string;
  testName: string;
  score: number;
  maxScore: number;
  percentile: number;
  earnedPoints: number;
  attemptedAt: string;
  userLabel: string;
};

type LocalLeaderboardRow = LocalAttempt & {
  rank: number;
  isCurrent: boolean;
};

type QuestionStatus = "not_visited" | "not_answered" | "answered" | "marked" | "answered_marked";
type TestUiMode = "sleek" | "nta";

const LOCAL_ATTEMPTS_KEY = "tayyari-local-test-attempts-v1";
const ACTIVE_TEST_KEY = "tayyari-active-test";
const ACTIVE_TEST_FALLBACK_KEY = "tayyari-active-test-fallback";

function normalizeSubject(subject: string) {
  if (subject === "Mathematics") {
    return "Math";
  }
  return subject;
}

function safeReadAttempts() {
  if (typeof window === "undefined") {
    return [] as LocalAttempt[];
  }

  const raw = window.localStorage.getItem(LOCAL_ATTEMPTS_KEY);
  if (!raw) {
    return [] as LocalAttempt[];
  }

  try {
    const parsed = JSON.parse(raw) as LocalAttempt[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as LocalAttempt[];
  }
}

function saveAttempts(items: LocalAttempt[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(LOCAL_ATTEMPTS_KEY, JSON.stringify(items.slice(-120)));
}

function makeAttemptId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildLeaderboardRows(allAttempts: LocalAttempt[], testName: string, currentId: string) {
  const relevant = allAttempts.filter((item) => item.testName === testName);

  relevant.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.percentile !== a.percentile) {
      return b.percentile - a.percentile;
    }
    return new Date(a.attemptedAt).getTime() - new Date(b.attemptedAt).getTime();
  });

  const rows: LocalLeaderboardRow[] = relevant.map((item, idx) => ({
    ...item,
    rank: idx + 1,
    isCurrent: item.id === currentId
  }));

  const current = rows.find((item) => item.isCurrent);
  return {
    rows,
    rank: current?.rank || 1
  };
}

function MockExamPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, user, refreshUser } = useAuth();

  const [session, setSession] = useState<ExamSession | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [lang, setLang] = useState("English");
  const [remainingSec, setRemainingSec] = useState(0);
  const [bootError, setBootError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [leaderboardRows, setLeaderboardRows] = useState<LocalLeaderboardRow[]>([]);
  const [targetRank, setTargetRank] = useState<number | null>(null);
  const [animatedRank, setAnimatedRank] = useState<number | null>(null);
  const [uiMode, setUiMode] = useState<TestUiMode>("sleek");
  const [quitOpen, setQuitOpen] = useState(false);

  const queryInstanceId = searchParams.get("instance")?.trim() || "";
  const queryBlueprintId = searchParams.get("blueprint")?.trim() || "";

  useEffect(() => {
    const savedMode = window.localStorage.getItem("tayyari-test-ui-mode");
    if (savedMode === "nta" || savedMode === "sleek") {
      setUiMode(savedMode);
    }
  }, []);

  const changeUiMode = (mode: TestUiMode) => {
    setUiMode(mode);
    window.localStorage.setItem("tayyari-test-ui-mode", mode);
  };

  useEffect(() => {
    const hydrate = async () => {
      setBootError("");
      const raw = window.sessionStorage.getItem(ACTIVE_TEST_KEY) || window.localStorage.getItem(ACTIVE_TEST_FALLBACK_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as ExamSession;
          setSession(parsed);
          window.sessionStorage.setItem(ACTIVE_TEST_KEY, raw);
          if (parsed.questions.length > 0) {
            setVisited({ [parsed.questions[0].id]: true });
          }
          const total = parsed.blueprint.durationMinutes * 60;
          const elapsed = Math.max(0, Math.floor((Date.now() - (parsed.launchedAt || Date.now())) / 1000));
          setRemainingSec(Math.max(0, total - elapsed));
          return;
        } catch {
          // continue to URL-based recovery
        }
      }

      if (queryInstanceId) {
        try {
          const payload = await fetchTestInstanceById(queryInstanceId);
          const recovered = { ...payload, launchedAt: Date.now() } as ExamSession;
          const serialized = JSON.stringify(recovered);
          window.sessionStorage.setItem(ACTIVE_TEST_KEY, serialized);
          window.localStorage.setItem(ACTIVE_TEST_FALLBACK_KEY, serialized);
          setSession(recovered);
          if (recovered.questions.length > 0) {
            setVisited({ [recovered.questions[0].id]: true });
          }
          setRemainingSec(recovered.blueprint.durationMinutes * 60);
          return;
        } catch {
          // continue to blueprint launch fallback
        }
      }

      if (queryBlueprintId) {
        try {
          const payload = await launchBlueprintTest(queryBlueprintId);
          const recovered = { ...payload, launchedAt: Date.now() } as ExamSession;
          const serialized = JSON.stringify(recovered);
          window.sessionStorage.setItem(ACTIVE_TEST_KEY, serialized);
          window.localStorage.setItem(ACTIVE_TEST_FALLBACK_KEY, serialized);
          setSession(recovered);
          if (recovered.questions.length > 0) {
            setVisited({ [recovered.questions[0].id]: true });
          }
          setRemainingSec(recovered.blueprint.durationMinutes * 60);
          return;
        } catch (error) {
          setBootError(error instanceof Error ? error.message : "Unable to launch test.");
        }
      } else if (!queryInstanceId) {
        setBootError("No active test session found. Start a test from the Tests page.");
      } else {
        setBootError("Unable to load this test session. Please start again from Tests.");
      }

      setSession(null);
    };

    void hydrate();
  }, [queryInstanceId, queryBlueprintId]);

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

  useEffect(() => {
    if (!targetRank) {
      return;
    }

    setAnimatedRank((prev) => (prev && prev > targetRank ? prev : Math.max(targetRank + 7, 10)));

    const timer = window.setInterval(() => {
      setAnimatedRank((prev) => {
        if (prev === null) {
          return targetRank;
        }
        if (prev <= targetRank) {
          window.clearInterval(timer);
          return targetRank;
        }
        return prev - 1;
      });
    }, 85);

    return () => window.clearInterval(timer);
  }, [targetRank]);

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
    for (const question of session.questions) {
      bucket.set(question.subject, (bucket.get(question.subject) || 0) + 1);
    }
    return Array.from(bucket.entries()).map(([subject, count]) => ({ subject, count }));
  }, [session]);

  const markCurrentVisited = () => {
    if (!session) {
      return;
    }
    const currentQuestionId = session.questions[currentIdx]?.id;
    if (currentQuestionId) {
      setVisited((prev) => ({ ...prev, [currentQuestionId]: true }));
    }
  };

  const moveTo = (idx: number) => {
    if (!session) {
      return;
    }
    markCurrentVisited();
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

      const res = session.testInstanceId === LOCAL_TEST_ID
        ? {
            score: 0,
            maxScore: session.questions.length * 4,
            earnedPoints: 0,
            percentile: 0,
            correctCount: 0,
            attemptedCount: Object.keys(payload).length,
            totalQuestions: session.questions.length,
            savedToCloud: false,
            topicBreakdown: [{ topic: "Unclassified", attempted: Object.keys(payload).length, correct: 0, accuracy: 0 }],
            difficultyBreakdown: [{ difficulty: "medium", attempted: Object.keys(payload).length, correct: 0, accuracy: 0 }]
          }
        : await submitBlueprintTest({
            testInstanceId: session.testInstanceId,
            answers: payload,
            timeTakenSeconds: session.blueprint.durationMinutes * 60 - remainingSec
          });

      if (session.testInstanceId === LOCAL_TEST_ID) {
        setResult({ ...res, unscored: true });
        window.sessionStorage.removeItem(ACTIVE_TEST_KEY);
        window.localStorage.removeItem(ACTIVE_TEST_FALLBACK_KEY);
        return;
      }

      const currentAttempt: LocalAttempt = {
        id: makeAttemptId(),
        testName: session.blueprint.name,
        score: res.score,
        maxScore: res.maxScore,
        percentile: res.percentile,
        earnedPoints: res.earnedPoints,
        attemptedAt: new Date().toISOString(),
        userLabel: isLoggedIn ? user.name || "Aspirant" : "Guest"
      };

      const allAttempts = [...safeReadAttempts(), currentAttempt];
      saveAttempts(allAttempts);

      const leaderboard = buildLeaderboardRows(allAttempts, session.blueprint.name, currentAttempt.id);
      setLeaderboardRows(leaderboard.rows.slice(0, 12));
      setTargetRank(leaderboard.rank);

      setResult({
        ...res,
        savedToCloud: Boolean(res.savedToCloud)
      });

      if (isLoggedIn && res.savedToCloud) {
        await refreshUser();
      }

      window.sessionStorage.removeItem(ACTIVE_TEST_KEY);
      window.localStorage.removeItem(ACTIVE_TEST_FALLBACK_KEY);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit test.");
    } finally {
      setSubmitting(false);
    }
  };

  const quitTest = () => {
    window.sessionStorage.removeItem(ACTIVE_TEST_KEY);
    window.localStorage.removeItem(ACTIVE_TEST_FALLBACK_KEY);
    router.push("/");
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
          <p className="muted">{bootError || "Start a test from the Tests page first."}</p>
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
    if (result.unscored) return <section className="page nta-result-page"><article className="card nta-result-card result-screen"><div className="result-screen-header"><div><p className="result-eyebrow">Practice complete</p><h1>{session.blueprint.name}</h1><p className="muted">You attempted {result.attemptedCount} of {result.totalQuestions} questions.</p></div></div><div className="result-note"><strong>This paper is not scored yet.</strong> Its imported questions have no verified answer key, so showing a score or rank would be misleading. Your six-question demo has a scored result.</div><div className="cta-row"><Link href="/tests" className="btn btn-outline">Back to tests</Link><Link href="/home" className="btn btn-solid">View dashboard</Link></div></article></section>;
    const scorePercent = result.maxScore > 0
      ? Math.max(0, Math.min(100, Math.round((result.score / result.maxScore) * 100)))
      : 0;

    return (
      <section className="page nta-result-page">
        <article className="card nta-result-card result-screen">
          <div className="result-screen-header">
            <div>
              <Link className="exam-back-link" href="/tests">
                <span aria-hidden="true">←</span> Back to tests
              </Link>
              <p className="result-eyebrow">Mock test complete</p>
              <h1>{session.blueprint.name}</h1>
              <p className="muted">Here is a clear snapshot of how this attempt went.</p>
            </div>
            <div className="result-save-status">
              <span className="result-status-dot" />
              {result.savedToCloud ? "Saved to your profile" : "Saved on this device"}
            </div>
          </div>

          <div className="result-overview">
            <div className="result-score-panel">
              <span className="result-panel-label">Your score</span>
              <div className="result-score-line">
                <strong>{result.score}</strong>
                <span>/ {result.maxScore}</span>
              </div>
              <div className="result-progress" aria-label={`Score ${scorePercent}%`}>
                <span style={{ width: `${scorePercent}%` }} />
              </div>
              <p className="muted">{scorePercent}% of the available marks</p>
            </div>

            <div className="result-stat-grid">
              <div className="result-stat-card">
                <span>Correct</span>
                <strong>{result.correctCount}</strong>
              </div>
              <div className="result-stat-card">
                <span>Attempted</span>
                <strong>{result.attemptedCount}<small>/{result.totalQuestions}</small></strong>
              </div>
              <div className="result-stat-card">
                <span>Percentile</span>
                <strong>{result.percentile}</strong>
              </div>
              <div className="result-stat-card result-rank-stat">
                <span><TrophyIcon size={14} /> Your rank</span>
                <strong>#{animatedRank ?? targetRank ?? 1}</strong>
              </div>
            </div>
          </div>

          <div className="result-note">
            <strong>JEE Main scoring:</strong> +4 for a correct answer, −1 for an incorrect answer, and 0 for an unattempted question.
          </div>

          <article className="card nta-inline-leaderboard">
            <div className="nta-inline-head">
              <h4>Test Leaderboard</h4>
              <span className="nta-inline-chip"><TrendIcon size={14} /> Latest attempt highlighted</span>
            </div>
            <div className="nta-inline-table-wrap">
              <table className="leaderboard-table nta-inline-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Candidate</th>
                    <th>Score</th>
                    <th>Percentile</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardRows.map((item) => (
                    <tr key={item.id} className={item.isCurrent ? "leader-row rank-current" : "leader-row"}>
                      <td>#{item.rank}</td>
                      <td>{item.userLabel}</td>
                      <td>{item.score}</td>
                      <td>{item.percentile}</td>
                      <td>{new Date(item.attemptedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <div className="grid-2">
            <article className="card result-breakdown-card">
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
            <article className="card result-breakdown-card">
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
            <button className="btn btn-solid" onClick={() => router.push("/tests")}>Take another test</button>
            <button className="btn btn-outline" onClick={() => router.push("/leaderboards")}>Open Leaderboards</button>
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
            <button className="btn btn-solid" onClick={() => router.push("/tests")}>Back to Tests</button>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className={`nta-page exam-mode-${uiMode}`}>
      <div className="nta-shell">
        <header className="nta-topbar">
          <div className="nta-brand">
            {uiMode === "nta" ? (
              <Image className="nta-official-logo" src="/nta-logo.png" alt="National Testing Agency" width={389} height={95} priority />
            ) : (
              <div className="exam-brand-lockup">
                <Image src="/tayyari-logo.png" alt="Tayyari" width={42} height={42} priority />
                <div>
                  <strong>Tayyari</strong>
                  <small>Focused practice</small>
                </div>
              </div>
            )}
          </div>
          <div className="nta-candidate">
            {uiMode === "nta" ? <Image className="nta-candidate-avatar" src="/nta-candidate.png" alt="Candidate" width={70} height={65} /> : null}
            <div className="nta-candidate-details">
              <p><span className="candidate-label">Candidate Name</span><span className="candidate-colon">:</span><strong>{user.name || "Aspirant"}</strong></p>
              <p><span className="candidate-label">Subject Name</span><span className="candidate-colon">:</span><strong>{session.blueprint.name}</strong></p>
              <p><span className="candidate-label">Remaining Time</span><span className="candidate-colon">:</span><strong>{formatTime(remainingSec)}</strong></p>
            </div>
          </div>
          <div className="exam-mode-control">
            <span className="exam-mode-caption">{uiMode === "nta" ? "NTA" : "Sleek"}</span>
            <button
              type="button"
              className={`test-mode-switch ${uiMode === "nta" ? "is-nta" : ""}`}
              role="switch"
              aria-checked={uiMode === "nta"}
              aria-label="Toggle NTA-style interface"
              title="Toggle NTA-style interface"
              onClick={() => changeUiMode(uiMode === "nta" ? "sleek" : "nta")}
            >
              <span className="test-mode-switch-knob" />
            </button>
          </div>
        </header>

        <div className="nta-subject-row">
          {uiMode === "nta" ? (
            <>
              <strong className="nta-exam-label">JEE MAIN</strong>
              {questionsBySubject.map((item) => (
                <button
                  key={item.subject}
                  className={`nta-subject-pill ${current?.subject === item.subject ? "active" : ""}`}
                  onClick={() => {
                    const first = session.questions.findIndex((question) => question.subject === item.subject);
                    if (first >= 0) moveTo(first);
                  }}
                >
                  {normalizeSubject(item.subject).toUpperCase()}
                </button>
              ))}
            </>
          ) : null}
          <div className="nta-lang-wrap">
            <label htmlFor="nta-lang">{uiMode === "nta" ? "Paper Language:" : "Language"}</label>
            <select id="nta-lang" value={lang} onChange={(event) => setLang(event.target.value)}>
              <option>English</option>
              <option>Hindi</option>
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
              {current.diagramImageUrl ? (
                <figure className="nta-question-diagram">
                  <img src={current.diagramImageUrl} alt={current.diagramCaption || "Question diagram"} loading="lazy" />
                  {current.diagramCaption ? <figcaption>{current.diagramCaption}</figcaption> : null}
                </figure>
              ) : null}
              {current.questionType === "mcq_single" ? (
                <div className="nta-options">
                  {(current.options.length > 0 ? current.options : [
                    { key: "A", text: "Option 1" },
                    { key: "B", text: "Option 2" },
                    { key: "C", text: "Option 3" },
                    { key: "D", text: "Option 4" }
                  ]).map((option, optionIndex) => {
                    const selected = (answers[current.id] || "").toUpperCase() === option.key;
                    return (
                      <label className={`nta-option ${selected ? "active" : ""}`} key={option.key}>
                        <input
                          type="radio"
                          name={`question-${current.id}`}
                          value={option.key}
                          checked={selected}
                          onChange={() => setAnswers((prev) => ({ ...prev, [current.id]: option.key }))}
                        />
                        <span>{optionIndex + 1})</span>
                        <span>{option.text}</span>
                      </label>
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
              <div className="nta-submit-actions">
                <button className="btn nta-quit-btn" onClick={() => setQuitOpen(true)} disabled={submitting}>
                  Quit
                </button>
                <button className="btn btn-solid nta-submit-btn" onClick={() => void onSubmit()} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
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
      {quitOpen ? (
        <div className="quit-modal-backdrop" role="presentation" onClick={() => setQuitOpen(false)}>
          <div className="quit-modal" role="dialog" aria-modal="true" aria-labelledby="quit-title" onClick={(event) => event.stopPropagation()}>
            <span className="quit-modal-icon">!</span>
            <h2 id="quit-title">Quit this test?</h2>
            <p>Your answers and progress will be lost if you leave now.</p>
            <div className="quit-modal-actions">
              <button className="btn btn-outline" onClick={() => setQuitOpen(false)}>Keep working</button>
              <button className="btn nta-quit-btn" onClick={quitTest}>Quit test</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default function MockExamPage() {
  return (
    <Suspense
      fallback={
        <section className="page">
          <article className="card">
            <h2>Loading test session...</h2>
            <p className="muted">Preparing exam interface.</p>
          </article>
        </section>
      }
    >
      <MockExamPageContent />
    </Suspense>
  );
}

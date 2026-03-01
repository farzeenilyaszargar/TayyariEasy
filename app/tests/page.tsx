"use client";

import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { AwardIcon, SearchIcon } from "@/components/ui-icons";
import {
  fetchTestsCatalog,
  launchBlueprintTest,
  submitBlueprintTest,
  type QuestionRow,
  type TestBlueprintRow,
  type TestInstanceRow
} from "@/lib/supabase-db";

type ScopeFilter = "All" | "topic" | "subject" | "full_mock";

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

function BlueprintCard({ blueprint, onLaunch }: { blueprint: TestBlueprintRow; onLaunch: (id: string) => void }) {
  return (
    <li className="test-card test-card-attractive">
      <div className="test-card-head">
        <span className="tiny-icon">{blueprint.scope === "topic" ? "T" : blueprint.scope === "subject" ? "S" : "F"}</span>
        <span className="subject-tag">{blueprint.scope.replace("_", " ")}</span>
      </div>
      <strong>{blueprint.name}</strong>
      <div className="test-stats">
        <span>Questions: {blueprint.question_count}</span>
        <span>Duration: {blueprint.duration_minutes} min</span>
        <span>Pool: {blueprint.availableQuestions}</span>
      </div>
      <div className="test-cta-row">
        <button className="btn btn-solid" onClick={() => onLaunch(blueprint.id)} disabled={blueprint.availableQuestions === 0}>
          Attempt
        </button>
      </div>
    </li>
  );
}

export default function TestsPage() {
  const { isLoggedIn } = useAuth();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<ScopeFilter>("All");
  const [catalog, setCatalog] = useState<TestBlueprintRow[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  const [active, setActive] = useState<TestInstanceRow | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [launching, setLaunching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoadingCatalog(true);
      setCatalogError("");
      try {
        const rows = await fetchTestsCatalog();
        if (alive) {
          setCatalog(rows);
        }
      } catch (error) {
        if (alive) {
          setCatalogError(error instanceof Error ? error.message : "Failed to load tests catalog.");
        }
      } finally {
        if (alive) {
          setLoadingCatalog(false);
        }
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      catalog.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) &&
          (scope === "All" || item.scope === scope)
      ),
    [catalog, query, scope]
  );

  const current: QuestionRow | null = active?.questions[questionIndex] || null;

  const startTest = async (blueprintId: string) => {
    setLaunching(true);
    setSubmitError("");
    setResult(null);
    try {
      const session = await launchBlueprintTest(blueprintId);
      setActive(session);
      setQuestionIndex(0);
      setAnswers({});
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to launch test.");
    } finally {
      setLaunching(false);
    }
  };

  const closeTest = () => {
    setActive(null);
    setQuestionIndex(0);
    setAnswers({});
    setSubmitting(false);
    setSubmitError("");
    setResult(null);
  };

  const updateAnswer = (questionId: string, value: string | number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const submitTest = async () => {
    if (!active) {
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const payload = await submitBlueprintTest({
        testInstanceId: active.testInstanceId,
        answers
      });
      setResult(payload);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit test.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page">
      <div className="page-head">
        <p className="eyebrow">Tests</p>
        <h1>Topic, Subject, and Full Mock Tests</h1>
      </div>

      <div className="search-row card tests-search-box">
        <div className="search-input-wrap">
          <SearchIcon size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tests" />
        </div>
        <div className="tag-filter">
          <button className={`subject-tag ${scope === "All" ? "active" : ""}`} onClick={() => setScope("All")}>
            All
          </button>
          <button className={`subject-tag ${scope === "topic" ? "active" : ""}`} onClick={() => setScope("topic")}>
            Topic
          </button>
          <button className={`subject-tag ${scope === "subject" ? "active" : ""}`} onClick={() => setScope("subject")}>
            Subject
          </button>
          <button className={`subject-tag ${scope === "full_mock" ? "active" : ""}`} onClick={() => setScope("full_mock")}>
            Full Mock
          </button>
        </div>
      </div>

      <article className="card">
        <h3>Available Tests</h3>
        <p className="muted">
          {loadingCatalog ? "Loading test catalog..." : "Generated from the live question bank and blueprint distribution."}
        </p>
        {catalogError ? <p className="muted">{catalogError}</p> : null}
        {submitError && !active ? <p className="muted">{submitError}</p> : null}
        {launching ? <p className="muted">Launching test...</p> : null}
        <ul className="test-list">
          {filtered.map((test) => (
            <BlueprintCard key={test.id} blueprint={test} onLaunch={startTest} />
          ))}
          {!loadingCatalog && filtered.length === 0 ? <li className="empty-state">No tests found.</li> : null}
        </ul>
      </article>

      {active ? (
        <div className="demo-modal-backdrop" role="dialog" aria-modal="true" aria-label="Live test interface">
          <div className="demo-modal">
            <div className="demo-modal-head">
              <div>
                <p className="eyebrow">Live Test Session</p>
                <h3>{active.blueprint.name}</h3>
              </div>
              <button className="btn btn-outline" onClick={closeTest}>
                Close
              </button>
            </div>

            {result ? (
              <div className="demo-finish">
                <span className="tiny-icon blue">
                  <AwardIcon size={14} />
                </span>
                <h3>Test submitted</h3>
                <p className="muted">
                  Score: {result.score} / {result.maxScore} | Percentile: {result.percentile}
                </p>
                <p className="muted">
                  Correct: {result.correctCount} | Attempted: {result.attemptedCount} / {result.totalQuestions}
                </p>
                {!isLoggedIn ? <p className="muted">Login required for score sync. Please log in and submit again.</p> : null}
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
                <button className="btn btn-solid" onClick={closeTest}>
                  Back to Tests
                </button>
              </div>
            ) : current ? (
              <>
                <div className="demo-progress">
                  <span>
                    Question {questionIndex + 1} / {active.questions.length}
                  </span>
                  <div className="xp-track">
                    <span style={{ width: `${((questionIndex + 1) / Math.max(1, active.questions.length)) * 100}%` }} />
                  </div>
                </div>

                <article className="demo-question card">
                  <p className="muted">
                    {current.subject} • {current.topic} • {current.difficulty}
                  </p>
                  <h4>{current.stemMarkdown}</h4>

                  {current.questionType === "mcq_single" ? (
                    <div className="demo-options">
                      {current.options.map((option) => (
                        <button
                          key={option.key}
                          className={`demo-option ${String(answers[current.id] || "") === option.key ? "active" : ""}`}
                          onClick={() => updateAnswer(current.id, option.key)}
                        >
                          {option.key}. {option.text}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="demo-options">
                      <input
                        className="demo-option"
                        type="number"
                        placeholder="Enter integer answer"
                        value={String(answers[current.id] || "")}
                        onChange={(event) => updateAnswer(current.id, Number(event.target.value))}
                      />
                    </div>
                  )}
                </article>

                <div className="demo-actions">
                  <button
                    className="btn btn-outline"
                    onClick={() => setQuestionIndex((prev) => Math.max(0, prev - 1))}
                    disabled={questionIndex === 0 || submitting}
                  >
                    Previous
                  </button>

                  {questionIndex < active.questions.length - 1 ? (
                    <button
                      className="btn btn-solid"
                      onClick={() => setQuestionIndex((prev) => Math.min(active.questions.length - 1, prev + 1))}
                      disabled={submitting}
                    >
                      Next
                    </button>
                  ) : (
                    <button className="btn btn-solid" onClick={() => void submitTest()} disabled={submitting || !isLoggedIn}>
                      {submitting ? "Submitting..." : isLoggedIn ? "Submit Test" : "Login to Submit"}
                    </button>
                  )}
                </div>
                {submitError ? <p className="muted">{submitError}</p> : null}
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { AwardIcon, SearchIcon } from "@/components/ui-icons";
import {
  createTestAttempt,
  fetchPublicTests,
  type SubjectTag,
  type TestCatalogRow
} from "@/lib/supabase-db";

const subjects: SubjectTag[] = ["Physics", "Chemistry", "Mathematics"];

const demoQuestions = [
  {
    question: "A particle moves with constant acceleration. Which graph is linear?",
    options: ["Displacement vs time", "Velocity vs time", "Acceleration vs time^2", "Kinetic energy vs time"],
    answerIndex: 1
  },
  {
    question: "For SN1 reactions, the rate depends primarily on:",
    options: ["Nucleophile strength", "Substrate concentration", "Solvent viscosity", "Temperature only"],
    answerIndex: 1
  },
  {
    question: "If f(x)=x^2 then integral from 0 to 2 of f(x) dx is:",
    options: ["4", "6", "8/3", "10/3"],
    answerIndex: 2
  }
];

function TestCardView({ test, cta, onAttempt }: { test: TestCatalogRow; cta: string; onAttempt: (test: TestCatalogRow) => void }) {
  return (
    <li className="test-card test-card-attractive">
      <div className="test-card-head">
        <span className={`tiny-icon subject-dot ${test.subject.toLowerCase()}`}>{test.icon}</span>
        <span className={`subject-tag ${test.subject.toLowerCase()}`}>{test.subject}</span>
      </div>
      <strong>{test.name}</strong>
      <div className="test-stats">
        <span>Avg score: {test.avg_score}</span>
        <span>Difficulty: {test.difficulty}</span>
        <span>Attempts: {test.attempts}</span>
      </div>
      <div className="test-cta-row">
        <button className="btn btn-solid" onClick={() => onAttempt(test)}>
          {cta}
        </button>
      </div>
    </li>
  );
}

export default function TestsPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState<SubjectTag | "All">("All");
  const [allTests, setAllTests] = useState<TestCatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTest, setActiveTest] = useState<TestCatalogRow | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string>("");
  const [finished, setFinished] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [savingAttempt, setSavingAttempt] = useState(false);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const rows = await fetchPublicTests();
        if (alive) {
          setAllTests(rows);
        }
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : "Failed to load tests from Supabase.");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, []);

  const matches = (name: string, itemSubject: SubjectTag) =>
    name.toLowerCase().includes(query.toLowerCase()) && (subject === "All" || itemSubject === subject);

  const filteredTopicTests = useMemo(
    () => allTests.filter((test) => test.type === "Topic" && matches(test.name, test.subject)),
    [allTests, query, subject]
  );

  const filteredFullTests = useMemo(
    () => allTests.filter((test) => test.type === "Full" && matches(test.name, test.subject)),
    [allTests, query, subject]
  );

  const startDemo = (test: TestCatalogRow) => {
    setActiveTest(test);
    setQuestionIndex(0);
    setSelected("");
    setFinished(false);
    setCorrect(0);
  };

  const closeDemo = () => {
    setActiveTest(null);
    setQuestionIndex(0);
    setSelected("");
    setFinished(false);
    setCorrect(0);
    setSavingAttempt(false);
  };

  const onNext = async () => {
    const current = demoQuestions[questionIndex];
    const isCorrect = current.options[current.answerIndex] === selected;
    const nextCorrect = correct + (isCorrect ? 1 : 0);

    if (questionIndex === demoQuestions.length - 1) {
      setCorrect(nextCorrect);
      setFinished(true);

      if (user.id && activeTest) {
        setSavingAttempt(true);
        const score = Math.round((nextCorrect / demoQuestions.length) * 300);
        const percentile = Math.round((nextCorrect / demoQuestions.length) * 10000) / 100;
        try {
          await createTestAttempt({
            userId: user.id,
            testName: activeTest.name,
            score,
            percentile
          });
        } finally {
          setSavingAttempt(false);
        }
      }
      return;
    }

    setCorrect(nextCorrect);
    setQuestionIndex((prev) => prev + 1);
    setSelected("");
  };

  const current = demoQuestions[questionIndex];

  return (
    <section className="page">
      <div className="page-head">
        <p className="eyebrow">Tests</p>
        <h1>Topic-Wise and Full-Syllabus Practice</h1>
      </div>

      <div className="search-row card tests-search-box">
        <div className="search-input-wrap">
          <SearchIcon size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tests by chapter or exam pattern"
          />
        </div>
        <div className="tag-filter">
          <button className={`subject-tag ${subject === "All" ? "active" : ""}`} onClick={() => setSubject("All")}>
            All
          </button>
          {subjects.map((item) => (
            <button
              key={item}
              className={`subject-tag ${item.toLowerCase()} ${subject === item ? "active" : ""}`}
              onClick={() => setSubject(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {loading ? <article className="card">Loading tests from Supabase...</article> : null}
      {error ? <article className="card">{error}</article> : null}

      <div className="grid-2 tests-grid-gap">
        <article className="card">
          <h3>Topic-Wise Tests</h3>
          <p className="muted">Sharpen weak areas with short, focused, chapter-level assessments.</p>
          <ul className="test-list">
            {filteredTopicTests.map((test) => (
              <TestCardView key={test.id} test={test} cta="Attempt" onAttempt={startDemo} />
            ))}
            {!loading && filteredTopicTests.length === 0 ? <li className="empty-state">No topic tests found.</li> : null}
          </ul>
        </article>

        <article className="card">
          <h3>Full-Syllabus Tests</h3>
          <p className="muted">Simulate real exam pressure and improve time strategy.</p>
          <ul className="test-list">
            {filteredFullTests.map((test) => (
              <TestCardView key={test.id} test={test} cta="Start" onAttempt={startDemo} />
            ))}
            {!loading && filteredFullTests.length === 0 ? <li className="empty-state">No full tests found.</li> : null}
          </ul>
        </article>
      </div>

      {activeTest ? (
        <div className="demo-modal-backdrop" role="dialog" aria-modal="true" aria-label="Demo test interface">
          <div className="demo-modal">
            <div className="demo-modal-head">
              <div>
                <p className="eyebrow">Demo Test UI</p>
                <h3>{activeTest.name}</h3>
              </div>
              <button className="btn btn-outline" onClick={closeDemo}>
                Close
              </button>
            </div>

            {finished ? (
              <div className="demo-finish">
                <span className="tiny-icon blue">
                  <AwardIcon size={14} />
                </span>
                <h3>Demo completed</h3>
                <p className="muted">
                  Correct answers: {correct}/{demoQuestions.length}
                </p>
                {user.id ? (
                  <p className="muted">{savingAttempt ? "Saving attempt to Supabase..." : "Attempt saved to Supabase."}</p>
                ) : (
                  <p className="muted">Login to persist attempts in Supabase.</p>
                )}
                <button className="btn btn-solid" onClick={closeDemo}>
                  Back to Tests
                </button>
              </div>
            ) : (
              <>
                <div className="demo-progress">
                  <span>
                    Question {questionIndex + 1} / {demoQuestions.length}
                  </span>
                  <div className="xp-track">
                    <span style={{ width: `${((questionIndex + 1) / demoQuestions.length) * 100}%` }} />
                  </div>
                </div>

                <article className="demo-question card">
                  <h4>{current.question}</h4>
                  <div className="demo-options">
                    {current.options.map((option) => (
                      <button
                        key={option}
                        className={`demo-option ${selected === option ? "active" : ""}`}
                        onClick={() => setSelected(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </article>

                <div className="demo-actions">
                  <button className="btn btn-outline" onClick={closeDemo}>
                    Exit Demo
                  </button>
                  <button className="btn btn-solid" onClick={() => void onNext()} disabled={!selected}>
                    {questionIndex === demoQuestions.length - 1 ? "Submit" : "Next"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

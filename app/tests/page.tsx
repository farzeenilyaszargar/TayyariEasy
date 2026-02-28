"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { AwardIcon, SearchIcon } from "@/components/ui-icons";
import { createTestAttempt } from "@/lib/supabase-db";

type LocalTest = {
  id: string;
  name: string;
  category: "General" | "Basic";
  avgScore: number;
  difficulty: "Easy" | "Medium";
  attempts: number;
  icon: string;
};

type SavedAttempt = {
  testName: string;
  score: number;
  percentile: number;
  date: string;
};

const LOCAL_ATTEMPTS_KEY = "tayyari-local-test-attempts";

const tests: LocalTest[] = [
  {
    id: "general-1",
    name: "General Practice Test 1",
    category: "General",
    avgScore: 162,
    difficulty: "Medium",
    attempts: 420,
    icon: "G"
  },
  {
    id: "general-2",
    name: "General Practice Test 2",
    category: "General",
    avgScore: 171,
    difficulty: "Medium",
    attempts: 338,
    icon: "G"
  },
  {
    id: "basic-1",
    name: "Basic Foundation Test 1",
    category: "Basic",
    avgScore: 118,
    difficulty: "Easy",
    attempts: 507,
    icon: "B"
  },
  {
    id: "basic-2",
    name: "Basic Foundation Test 2",
    category: "Basic",
    avgScore: 126,
    difficulty: "Easy",
    attempts: 446,
    icon: "B"
  }
];

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

function TestCardView({ test, onAttempt }: { test: LocalTest; onAttempt: (test: LocalTest) => void }) {
  return (
    <li className="test-card test-card-attractive">
      <div className="test-card-head">
        <span className="tiny-icon">{test.icon}</span>
        <span className="subject-tag">{test.category}</span>
      </div>
      <strong>{test.name}</strong>
      <div className="test-stats">
        <span>Avg score: {test.avgScore}</span>
        <span>Difficulty: {test.difficulty}</span>
        <span>Attempts: {test.attempts}</span>
      </div>
      <div className="test-cta-row">
        <button className="btn btn-solid" onClick={() => onAttempt(test)}>
          Attempt
        </button>
      </div>
    </li>
  );
}

export default function TestsPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | "General" | "Basic">("All");
  const [activeTest, setActiveTest] = useState<LocalTest | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string>("");
  const [finished, setFinished] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [savedAttempts, setSavedAttempts] = useState<SavedAttempt[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    const raw = window.localStorage.getItem(LOCAL_ATTEMPTS_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as SavedAttempt[];
      setSavedAttempts(parsed);
    } catch {
      setSavedAttempts([]);
    }
  }, []);

  const filtered = useMemo(
    () =>
      tests.filter(
        (test) =>
          test.name.toLowerCase().includes(query.toLowerCase()) &&
          (category === "All" || test.category === category)
      ),
    [query, category]
  );

  const startDemo = (test: LocalTest) => {
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
    setSyncing(false);
    setSyncMessage("");
  };

  const onNext = async () => {
    const current = demoQuestions[questionIndex];
    const isCorrect = current.options[current.answerIndex] === selected;
    const nextCorrect = correct + (isCorrect ? 1 : 0);

    if (questionIndex === demoQuestions.length - 1) {
      setCorrect(nextCorrect);
      setFinished(true);

      if (activeTest) {
        const score = Math.round((nextCorrect / demoQuestions.length) * 300);
        const percentile = Math.round((nextCorrect / demoQuestions.length) * 10000) / 100;
        const saved: SavedAttempt = {
          testName: activeTest.name,
          score,
          percentile,
          date: new Date().toISOString().slice(0, 10)
        };
        const updated = [saved, ...savedAttempts].slice(0, 10);
        setSavedAttempts(updated);
        window.localStorage.setItem(LOCAL_ATTEMPTS_KEY, JSON.stringify(updated));

        if (user.id) {
          setSyncing(true);
          setSyncMessage("");
          try {
            await createTestAttempt({
              userId: user.id,
              testName: activeTest.name,
              score,
              percentile
            });
            setSyncMessage("Score synced to Supabase.");
          } catch (error) {
            setSyncMessage(error instanceof Error ? `Supabase sync failed: ${error.message}` : "Supabase sync failed.");
          } finally {
            setSyncing(false);
          }
        } else {
          setSyncMessage("Login to sync this score to Supabase.");
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
        <h1>General and Basic Tests (Local Mode)</h1>
      </div>

      <div className="search-row card tests-search-box">
        <div className="search-input-wrap">
          <SearchIcon size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search general or basic tests"
          />
        </div>
        <div className="tag-filter">
          <button className={`subject-tag ${category === "All" ? "active" : ""}`} onClick={() => setCategory("All")}>
            All
          </button>
          <button
            className={`subject-tag ${category === "General" ? "active" : ""}`}
            onClick={() => setCategory("General")}
          >
            General
          </button>
          <button
            className={`subject-tag ${category === "Basic" ? "active" : ""}`}
            onClick={() => setCategory("Basic")}
          >
            Basic
          </button>
        </div>
      </div>

      <article className="card">
        <h3>Available Tests</h3>
        <p className="muted">Local testing mode active. Scores are saved in your browser only.</p>
        <ul className="test-list">
          {filtered.map((test) => (
            <TestCardView key={test.id} test={test} onAttempt={startDemo} />
          ))}
          {filtered.length === 0 ? <li className="empty-state">No tests found.</li> : null}
        </ul>
      </article>

      <article className="card" style={{ marginTop: "16px" }}>
        <h3>Recent Local Scores</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Test</th>
                <th>Date</th>
                <th>Score</th>
                <th>Percentile</th>
              </tr>
            </thead>
            <tbody>
              {savedAttempts.length > 0 ? (
                savedAttempts.map((attempt, idx) => (
                  <tr key={`${attempt.testName}-${attempt.date}-${idx}`}>
                    <td>{attempt.testName}</td>
                    <td>{attempt.date}</td>
                    <td>{attempt.score}</td>
                    <td>{attempt.percentile}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="muted">
                    No local attempts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

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
                <p className="muted">
                  Score: {Math.round((correct / demoQuestions.length) * 300)} | Percentile:{" "}
                  {Math.round((correct / demoQuestions.length) * 10000) / 100}
                </p>
                <p className="muted">Saved locally for testing.</p>
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
            {syncing ? <p className="muted">Syncing score to Supabase...</p> : null}
            {syncMessage ? <p className="muted">{syncMessage}</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

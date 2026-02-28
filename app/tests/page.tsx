"use client";

import { useMemo, useState } from "react";
import { fullSyllabusTests, topicTests, type SubjectTag, type TestCard } from "@/lib/data";
import { AwardIcon, SearchIcon } from "@/components/ui-icons";

const subjects: SubjectTag[] = ["Physics", "Chemistry", "Mathematics"];

const demoQuestions = [
  {
    question: "A particle moves with constant acceleration. Which graph is linear?",
    options: ["Displacement vs time", "Velocity vs time", "Acceleration vs time^2", "Kinetic energy vs time"]
  },
  {
    question: "For SN1 reactions, the rate depends primarily on:",
    options: ["Nucleophile strength", "Substrate concentration", "Solvent viscosity", "Temperature only"]
  },
  {
    question: "If f(x)=x^2 then integral from 0 to 2 of f(x) dx is:",
    options: ["4", "6", "8/3", "10/3"]
  }
];

function TestCardView({ test, cta, onAttempt }: { test: TestCard; cta: string; onAttempt: (test: TestCard) => void }) {
  return (
    <li className="test-card test-card-attractive">
      <div className="test-card-head">
        <span className={`tiny-icon subject-dot ${test.subject.toLowerCase()}`}>{test.icon}</span>
        <span className={`subject-tag ${test.subject.toLowerCase()}`}>{test.subject}</span>
      </div>
      <strong>{test.name}</strong>
      <div className="test-stats">
        <span>Avg score: {test.avgScore}</span>
        <span>Difficulty: {test.difficulty}</span>
        <span>Attempts: {test.attempts}</span>
      </div>
      <div className="test-cta-row">
        <button className="btn btn-solid" onClick={() => onAttempt(test)}>
          {cta}
        </button>
        <span className="test-xp">+120 XP</span>
      </div>
    </li>
  );
}

export default function TestsPage() {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState<SubjectTag | "All">("All");
  const [activeTest, setActiveTest] = useState<TestCard | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string>("");
  const [finished, setFinished] = useState(false);

  const matches = (name: string, itemSubject: SubjectTag) =>
    name.toLowerCase().includes(query.toLowerCase()) && (subject === "All" || itemSubject === subject);

  const filteredTopicTests = useMemo(
    () => topicTests.filter((test) => matches(test.name, test.subject)),
    [query, subject]
  );

  const filteredFullTests = useMemo(
    () => fullSyllabusTests.filter((test) => matches(test.name, test.subject)),
    [query, subject]
  );

  const startDemo = (test: TestCard) => {
    setActiveTest(test);
    setQuestionIndex(0);
    setSelected("");
    setFinished(false);
  };

  const closeDemo = () => {
    setActiveTest(null);
    setQuestionIndex(0);
    setSelected("");
    setFinished(false);
  };

  const onNext = () => {
    if (questionIndex === demoQuestions.length - 1) {
      setFinished(true);
      return;
    }

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

      <div className="grid-2 tests-grid-gap">
        <article className="card">
          <h3>Topic-Wise Tests</h3>
          <p className="muted">Sharpen weak areas with short, focused, chapter-level assessments.</p>
          <ul className="test-list">
            {filteredTopicTests.map((test) => (
              <TestCardView key={test.id} test={test} cta="Attempt" onAttempt={startDemo} />
            ))}
            {filteredTopicTests.length === 0 ? <li className="empty-state">No topic tests found.</li> : null}
          </ul>
        </article>

        <article className="card">
          <h3>Full-Syllabus Tests</h3>
          <p className="muted">Simulate real exam pressure and improve time strategy.</p>
          <ul className="test-list">
            {filteredFullTests.map((test) => (
              <TestCardView key={test.id} test={test} cta="Start" onAttempt={startDemo} />
            ))}
            {filteredFullTests.length === 0 ? <li className="empty-state">No full tests found.</li> : null}
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
                <p className="muted">Great run. In final version, this will show score, rank estimate, and analysis.</p>
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
                  <button className="btn btn-solid" onClick={onNext} disabled={!selected}>
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

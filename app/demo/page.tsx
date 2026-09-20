"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pickDemoQuestions, type DemoQuestion } from "@/lib/demo-questions";

type DemoResult = { score: number; correct: number; attempted: number; placement: number; total: number };
const DEMO_SCORES = [23, 19, 16, 12, 10, 7, 4, 0];

export default function DemoPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<DemoQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<DemoResult | null>(null);

  useEffect(() => { setQuestions(pickDemoQuestions()); }, []);

  const finish = () => {
    const correct = questions.filter((question) => answers[question.id] === question.answer).length;
    const attempted = questions.filter((question) => answers[question.id] !== undefined).length;
    const score = correct * 4 - (attempted - correct);
    const placement = 1 + DEMO_SCORES.filter((item) => item > score).length;
    const nextResult = { score, correct, attempted, placement, total: DEMO_SCORES.length + 1 };
    setResult(nextResult);
    window.sessionStorage.setItem("tayyari-demo-result", JSON.stringify(nextResult));
  };

  if (!questions.length) return <section className="demo-shell" aria-label="Preparing your demo" />;
  if (result) return <section className="demo-shell demo-result"><span className="demo-kicker">Demo completed</span><h1>Here’s your starting point.</h1><p>Six questions across Physics, Chemistry and Mathematics.</p><div className="demo-result-grid"><div><span>Score</span><strong>{result.score}<small> / 24</small></strong></div><div><span>Correct</span><strong>{result.correct}<small> / 6</small></strong></div><div><span>Preview rank</span><strong>#{result.placement}<small> / {result.total}</small></strong></div></div><p className="demo-rank-note">This rank compares your score with illustrative demo scores. It is not a live student ranking.</p><div className="demo-review"><h2>Review your answers</h2>{questions.map((item) => <div key={item.id}><span>{item.subject}</span><strong>{item.prompt}</strong><small>{answers[item.id] === undefined ? "Skipped" : answers[item.id] === item.answer ? "Correct" : "Incorrect"} · {item.explanation}</small></div>)}</div><button className="btn btn-solid" onClick={() => router.push("/leaderboards?from=demo")}>See the leaderboard →</button></section>;

  const question = questions[index];
  return <section className="demo-shell"><header className="demo-head"><div><span className="demo-kicker">Your first six questions</span><h1>Find your starting point.</h1><p>Two easy questions per subject. No account needed.</p></div><div className="demo-progress-label">{index + 1} / 6</div></header><div className="demo-progress-track"><span style={{ width: `${((index + 1) / 6) * 100}%` }} /></div><div className="demo-question-card"><div className="demo-question-top"><span>{question.subject}</span><span>Question {index + 1}</span></div><h2>{question.prompt}</h2><div className="demo-options">{question.options.map((option, choice) => <button type="button" key={option} className={answers[question.id] === choice ? "demo-option is-selected" : "demo-option"} onClick={() => setAnswers((previous) => ({ ...previous, [question.id]: choice }))}><span>{String.fromCharCode(65 + choice)}</span>{option}</button>)}</div></div><footer className="demo-actions"><button type="button" className="btn btn-outline" disabled={index === 0} onClick={() => setIndex(index - 1)}>Previous</button><button type="button" className="btn btn-solid" onClick={() => index === 5 ? finish() : setIndex(index + 1)}>{index === 5 ? "See my result" : "Next question"}</button></footer><p className="demo-source">Introductory practice based on NCERT Class XI concepts. Scoring: +4 correct, −1 incorrect, 0 skipped.</p></section>;
}

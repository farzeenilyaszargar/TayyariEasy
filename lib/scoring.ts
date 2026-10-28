import { MARKS_CORRECT, MARKS_WRONG, MARKS_WRONG_NUMERICAL, NUMERICAL_TOLERANCE } from "./config";
import type { AnswerKey, Attempt, Difficulty, Question, Subject, TestPaper } from "./types";

export type Outcome = "correct" | "wrong" | "skipped";

// Mirrors submit_attempt() in the database, which is the source of truth for scores.
export function outcomeOf(q: Question, key: AnswerKey, response: number | null | undefined): Outcome {
  if (response === null || response === undefined || Number.isNaN(response)) return "skipped";
  if (q.type === "mcq") return response === key.answer ? "correct" : "wrong";
  return Math.abs(response - key.answer) <= NUMERICAL_TOLERANCE ? "correct" : "wrong";
}

export function marksFor(q: Question, outcome: Outcome) {
  if (outcome === "correct") return MARKS_CORRECT;
  if (outcome === "wrong") return q.type === "mcq" ? MARKS_WRONG : MARKS_WRONG_NUMERICAL;
  return 0;
}

export interface QuestionResult {
  question: Question;
  key: AnswerKey;
  response: number | null;
  outcome: Outcome;
  marks: number;
  timeSec: number;
}

export interface Bucket {
  key: string;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  score: number;
  maxScore: number;
  timeSec: number;
}

export interface Analysis {
  results: QuestionResult[];
  score: number;
  maxScore: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number; // correct / attempted
  timeSec: number;
  negativeMarks: number;
  bySubject: Bucket[];
  byChapter: Bucket[];
  byDifficulty: Bucket[];
  // deep (pro) insights
  sillyMistakes: QuestionResult[]; // easy questions answered wrong
  overTime: QuestionResult[]; // took > 2x ideal time
  quickWrong: QuestionResult[]; // answered wrong in < 30% of ideal time (guessing)
  strongChapters: Bucket[];
  weakChapters: Bucket[];
}

function bucketize(results: QuestionResult[], keyOf: (r: QuestionResult) => string): Bucket[] {
  const map = new Map<string, Bucket>();
  for (const r of results) {
    const key = keyOf(r);
    const b = map.get(key) ?? { key, total: 0, correct: 0, wrong: 0, skipped: 0, score: 0, maxScore: 0, timeSec: 0 };
    b.total++;
    b[r.outcome]++;
    b.score += r.marks;
    b.maxScore += MARKS_CORRECT;
    b.timeSec += r.timeSec;
    map.set(key, b);
  }
  return [...map.values()];
}

export function analyze(
  attempt: Attempt, test: TestPaper, questionMap: Record<string, Question>, keys: Record<string, AnswerKey>,
): Analysis {
  const results: QuestionResult[] = test.questionIds.filter((id) => questionMap[id] && keys[id]).map((id) => {
    const question = questionMap[id];
    const key = { answer: Number(keys[id].answer), solution: keys[id].solution };
    const rec = attempt.answers[id];
    const response = rec?.response ?? null;
    const outcome = outcomeOf(question, key, response);
    return { question, key, response, outcome, marks: marksFor(question, outcome), timeSec: rec?.timeSec ?? 0 };
  });

  const correct = results.filter((r) => r.outcome === "correct").length;
  const wrong = results.filter((r) => r.outcome === "wrong").length;
  const skipped = results.length - correct - wrong;
  const score = results.reduce((s, r) => s + r.marks, 0);
  const byChapter = bucketize(results, (r) => r.question.chapter);
  const chapterPct = (b: Bucket) => b.correct / b.total;

  return {
    results,
    score,
    maxScore: results.length * MARKS_CORRECT,
    correct,
    wrong,
    skipped,
    accuracy: correct + wrong ? correct / (correct + wrong) : 0,
    timeSec: results.reduce((s, r) => s + r.timeSec, 0),
    negativeMarks: results.filter((r) => r.marks < 0).reduce((s, r) => s - r.marks, 0),
    bySubject: bucketize(results, (r) => r.question.subject),
    byChapter,
    byDifficulty: bucketize(results, (r) => r.question.difficulty),
    sillyMistakes: results.filter((r) => r.outcome === "wrong" && r.question.difficulty === "easy"),
    overTime: results.filter((r) => r.timeSec > r.question.idealTimeSec * 2),
    quickWrong: results.filter((r) => r.outcome === "wrong" && r.timeSec < r.question.idealTimeSec * 0.3),
    strongChapters: byChapter.filter((b) => chapterPct(b) >= 0.75).sort((a, b) => chapterPct(b) - chapterPct(a)),
    weakChapters: byChapter.filter((b) => chapterPct(b) < 0.5).sort((a, b) => chapterPct(a) - chapterPct(b)),
  };
}

// Rough score → percentile curve for JEE Main style papers. Placeholder until
// there is enough real attempt data to compute percentiles from the platform itself.
export function estimatePercentile(score: number, maxScore: number) {
  const pct = Math.max(0, score) / maxScore;
  const p = 100 * (1 - Math.exp(-4.2 * pct));
  return Math.min(99.99, Math.round(p * 100) / 100);
}

export function estimateRank(percentile: number, candidates = 1_200_000) {
  return Math.max(1, Math.round(((100 - percentile) / 100) * candidates));
}

export const SUBJECTS: Subject[] = ["Physics", "Chemistry", "Mathematics"];
export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export const fmtTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}m ${s.toString().padStart(2, "0")}s`;
};

export type Subject = "Physics" | "Chemistry" | "Mathematics";
export type Difficulty = "easy" | "medium" | "hard";
export type Plan = "free" | "pro";

export interface Question {
  id: string;
  subject: Subject;
  chapter: string;
  difficulty: Difficulty;
  type: "mcq" | "numerical";
  text: string;
  options: string[] | null; // mcq only
  imageUrl: string | null;
  idealTimeSec: number;
}

// Revealed only after an attempt is submitted (get_attempt_review).
export interface AnswerKey {
  answer: number;
  solution: string;
}

export type TestKind = "full" | "subject" | "chapter";

export interface TestPaper {
  id: string;
  title: string;
  kind: TestKind;
  subject: Subject | null;
  description: string;
  durationMin: number;
  questionIds: string[];
  releasedAt: string; // ISO date
}

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  targetYear: number | null;
  plan: Plan; // effective plan (pro only while pro_until is in the future)
  proUntil: string | null;
  points: number;
}

export interface AnswerRecord {
  response: number | null; // option index or numeric value
  timeSec: number;
  markedForReview: boolean;
  visited: boolean;
}

export interface Attempt {
  id: string;
  testId: string;
  startedAt: string;
  submittedAt: string | null;
  answers: Record<string, AnswerRecord>;
  score: number | null;
  maxScore: number | null;
  correct: number | null;
  wrong: number | null;
  skipped: number | null;
  summary: { subjects: Record<string, { total: number; correct: number; wrong: number; score: number; max: number }> } | null;
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  points: number;
}

export interface EarnedBadge {
  badgeId: string;
  earnedAt: string;
}

export type LeaderboardKind = "weekly" | "overall" | "test" | "points";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  score: number;
  testsTaken: number;
  isYou: boolean;
}

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
  options?: string[]; // mcq only
  answer: number; // mcq: option index, numerical: value
  solution: string;
  idealTimeSec: number; // used by deep analysis
}

export type TestKind = "full" | "subject" | "chapter";

export interface TestPaper {
  id: string;
  title: string;
  kind: TestKind;
  subject?: Subject;
  description: string;
  durationMin: number;
  questionIds: string[];
  releasedAt: string; // ISO date
}

export interface User {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  createdAt: string;
}

export interface AnswerRecord {
  questionId: string;
  response: number | null; // option index or numeric value
  timeSec: number;
  markedForReview: boolean;
  visited: boolean;
}

export interface Attempt {
  id: string;
  userId: string;
  testId: string;
  startedAt: string;
  submittedAt?: string;
  answers: Record<string, AnswerRecord>;
  score?: number;
  maxScore?: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  score: number;
  testsTaken: number;
  isYou?: boolean;
}

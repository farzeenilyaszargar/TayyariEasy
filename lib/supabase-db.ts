"use client";

import { getStoredSession, getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase-auth";

export type SubjectTag = "Physics" | "Chemistry" | "Mathematics";
export type Difficulty = "Easy" | "Medium" | "Hard";

export type ProfileRow = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  points: number;
  target_exam: string | null;
  current_streak: number;
  tests_completed: number;
};

export type AnalyticsRow = {
  user_id: string;
  predicted_rank_low: number | null;
  predicted_rank_high: number | null;
  estimated_score_low: number | null;
  estimated_score_high: number | null;
  confidence_label: string | null;
};

export type BadgeRow = {
  id: number;
  badge_name: string;
  badge_detail: string;
  earned_at?: string;
};

export type TestAttemptRow = {
  id: number;
  test_name: string;
  attempted_at: string;
  score: number;
  percentile: number;
};

export type TestCatalogRow = {
  id: string;
  name: string;
  subject: SubjectTag;
  type: "Topic" | "Full";
  avg_score: number;
  difficulty: Difficulty;
  attempts: number;
  icon: string;
};

export type ResourceRow = {
  id: string;
  title: string;
  type: string;
  size: string;
  subject: SubjectTag;
  category: "Roadmaps" | "Strategies" | "Notes" | "Books" | "Problems" | "PYQs";
  preview: string;
  href: string;
};

export type InsightRow = {
  id: number;
  insight: string;
};

export type LeaderboardRow = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  points: number;
  current_streak: number;
  tests_completed: number;
};

export type QuestionRow = {
  id: string;
  position: number;
  questionType: "mcq_single" | "integer";
  stemMarkdown: string;
  stemLatex: string | null;
  subject: SubjectTag;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  negativeMarks: number;
  options: Array<{
    key: "A" | "B" | "C" | "D";
    text: string;
    latex: string | null;
  }>;
};

export type TestBlueprintRow = {
  id: string;
  name: string;
  scope: "topic" | "subject" | "full_mock";
  subject: SubjectTag | null;
  topic: string | null;
  question_count: number;
  duration_minutes: number;
  negative_marking: boolean;
  availableQuestions: number;
};

export type TestInstanceRow = {
  testInstanceId: string;
  blueprint: {
    id: string;
    name: string;
    scope: "topic" | "subject" | "full_mock";
    subject: SubjectTag | null;
    topic: string | null;
    durationMinutes: number;
    negativeMarking: boolean;
  };
  questions: QuestionRow[];
};

export type ReviewQueueRow = {
  id: string;
  question_id: string;
  reason_codes: string[];
  priority: number;
  status: "open" | "approved" | "rejected";
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  question_bank?: {
    id: string;
    subject: SubjectTag;
    topic: string;
    subtopic: string | null;
    difficulty: "easy" | "medium" | "hard";
    source_kind: "historical" | "hard_curated" | "ai_generated";
    quality_score: number;
    stem_markdown: string;
  };
};

export type DashboardPayload = {
  profile: ProfileRow | null;
  analytics: AnalyticsRow | null;
  badges: BadgeRow[];
  tests: TestAttemptRow[];
  insights: InsightRow[];
};

function getAuthHeaders() {
  const session = getStoredSession();
  const anonKey = getSupabaseAnonKey();
  if (!session || !anonKey) {
    throw new Error("Supabase session unavailable.");
  }

  return {
    apikey: anonKey,
    Authorization: `Bearer ${session.accessToken}`
  };
}

function getPublicHeaders() {
  const anonKey = getSupabaseAnonKey();
  if (!anonKey) {
    throw new Error("Supabase anon key unavailable.");
  }

  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`
  };
}

async function restGet<T>(path: string, mode: "auth" | "public"): Promise<T> {
  const url = getSupabaseUrl();
  if (!url) {
    throw new Error("Supabase URL unavailable.");
  }

  const headers = mode === "auth" ? getAuthHeaders() : getPublicHeaders();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Supabase query failed.");
  }

  return (await response.json()) as T;
}

export async function fetchOwnProfile(userId: string): Promise<ProfileRow | null> {
  const rows = await restGet<ProfileRow[]>(
    `user_profiles?select=user_id,full_name,avatar_url,points,target_exam,current_streak,tests_completed&user_id=eq.${userId}&limit=1`,
    "auth"
  );
  return rows[0] ?? null;
}

export async function fetchDashboardData(userId: string): Promise<DashboardPayload> {
  const baseFilter = `user_id=eq.${userId}`;
  const [profiles, analytics, badges, tests, insights] = await Promise.all([
    restGet<ProfileRow[]>(
      `user_profiles?select=user_id,full_name,avatar_url,points,target_exam,current_streak,tests_completed&${baseFilter}&limit=1`,
      "auth"
    ),
    restGet<AnalyticsRow[]>(
      `user_analytics?select=user_id,predicted_rank_low,predicted_rank_high,estimated_score_low,estimated_score_high,confidence_label&${baseFilter}&limit=1`,
      "auth"
    ),
    restGet<BadgeRow[]>(
      `user_badges?select=id,badge_name,badge_detail,earned_at&${baseFilter}&order=earned_at.desc&limit=6`,
      "auth"
    ),
    restGet<TestAttemptRow[]>(
      `test_attempts?select=id,test_name,attempted_at,score,percentile&${baseFilter}&order=attempted_at.desc&limit=12`,
      "auth"
    ),
    restGet<InsightRow[]>(
      `ai_insights?select=id,insight&${baseFilter}&order=created_at.desc&limit=8`,
      "auth"
    )
  ]);

  return {
    profile: profiles[0] ?? null,
    analytics: analytics[0] ?? null,
    badges,
    tests,
    insights
  };
}

export async function fetchPublicTests() {
  return restGet<TestCatalogRow[]>(
    "tests_catalog?select=id,name,subject,type,avg_score,difficulty,attempts,icon&order=name.asc",
    "public"
  );
}

export async function fetchPublicResources() {
  return restGet<ResourceRow[]>(
    "resources_library?select=id,title,type,size,subject,category,preview,href&order=title.asc",
    "public"
  );
}

export async function fetchPublicLeaderboard() {
  return restGet<LeaderboardRow[]>(
    "user_profiles?select=user_id,full_name,avatar_url,points,current_streak,tests_completed&order=points.desc&limit=20",
    "public"
  );
}

export async function fetchSearchIndex() {
  const [tests, resources] = await Promise.all([fetchPublicTests(), fetchPublicResources()]);
  return [
    ...tests.map((item) => item.name),
    ...resources.map((item) => item.title)
  ];
}

export async function createTestAttempt(payload: {
  userId: string;
  testName: string;
  score: number;
  percentile: number;
  attemptedAt?: string;
}) {
  const url = getSupabaseUrl();
  if (!url) {
    throw new Error("Supabase URL unavailable.");
  }

  const headers = getAuthHeaders();
  const response = await fetch(`${url}/rest/v1/test_attempts`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify([
      {
        user_id: payload.userId,
        test_name: payload.testName,
        score: payload.score,
        percentile: payload.percentile,
        attempted_at: payload.attemptedAt ?? new Date().toISOString().slice(0, 10)
      }
    ])
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to create test attempt.");
  }
}

function getApiHeaders() {
  const session = getStoredSession();
  return {
    "Content-Type": "application/json",
    ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {})
  };
}

export async function fetchTestsCatalog(params?: {
  scope?: "topic" | "subject" | "full_mock";
  subject?: SubjectTag;
  topic?: string;
}) {
  const query = new URLSearchParams();
  if (params?.scope) {
    query.set("scope", params.scope);
  }
  if (params?.subject) {
    query.set("subject", params.subject);
  }
  if (params?.topic) {
    query.set("topic", params.topic);
  }

  const response = await fetch(`/api/tests/catalog${query.toString() ? `?${query.toString()}` : ""}`, {
    cache: "no-store"
  });

  const payload = (await response.json()) as { items?: TestBlueprintRow[]; error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Failed to load tests catalog.");
  }

  return payload.items || [];
}

export async function launchBlueprintTest(blueprintId: string) {
  const response = await fetch("/api/tests/launch", {
    method: "POST",
    headers: getApiHeaders(),
    body: JSON.stringify({ blueprintId })
  });

  const payload = (await response.json()) as TestInstanceRow & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Failed to launch test.");
  }

  return payload;
}

export async function submitBlueprintTest(payload: {
  testInstanceId: string;
  answers: Record<string, string | number>;
  timeTakenSeconds?: number;
}) {
  const response = await fetch("/api/tests/submit", {
    method: "POST",
    headers: getApiHeaders(),
    body: JSON.stringify(payload)
  });

  const data = (await response.json()) as {
    error?: string;
    score: number;
    maxScore: number;
    percentile: number;
    correctCount: number;
    attemptedCount: number;
    totalQuestions: number;
    topicBreakdown: Array<{ topic: string; attempted: number; correct: number; accuracy: number }>;
    difficultyBreakdown: Array<{ difficulty: string; attempted: number; correct: number; accuracy: number }>;
  };

  if (!response.ok) {
    throw new Error(data.error || "Failed to submit test.");
  }

  return data;
}

export async function fetchReviewQueue(adminToken: string, status: "open" | "approved" | "rejected" = "open") {
  const response = await fetch(`/api/questions/review-queue?status=${status}`, {
    headers: {
      "x-admin-token": adminToken
    },
    cache: "no-store"
  });
  const payload = (await response.json()) as { items?: ReviewQueueRow[]; error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Failed to fetch review queue.");
  }
  return payload.items || [];
}

export async function submitReviewDecision(payload: {
  adminToken: string;
  queueId: string;
  action: "approved" | "rejected";
  notes?: string;
  publish?: boolean;
}) {
  const response = await fetch("/api/questions/review", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": payload.adminToken
    },
    body: JSON.stringify({
      queueId: payload.queueId,
      action: payload.action,
      notes: payload.notes,
      publish: payload.publish
    })
  });
  const data = (await response.json()) as { ok?: boolean; error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Failed to submit review decision.");
  }
  return data.ok === true;
}

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

"use client";

import { getStoredSession, getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase-auth";

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  points: number;
  target_exam: string | null;
  current_streak: number;
};

type AnalyticsRow = {
  user_id: string;
  predicted_rank_low: number | null;
  predicted_rank_high: number | null;
  estimated_score_low: number | null;
  estimated_score_high: number | null;
  confidence_label: string | null;
};

type BadgeRow = {
  id: number;
  badge_name: string;
  badge_detail: string;
};

type TestRow = {
  id: number;
  test_name: string;
  attempted_at: string;
  score: number;
  percentile: number;
};

type InsightRow = {
  id: number;
  insight: string;
};

export type DashboardPayload = {
  profile: ProfileRow | null;
  analytics: AnalyticsRow | null;
  badges: BadgeRow[];
  tests: TestRow[];
  insights: InsightRow[];
};

async function supabaseGet<T>(path: string) {
  const session = getStoredSession();
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!session || !url || !anonKey) {
    throw new Error("Supabase session or config unavailable.");
  }

  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${session.accessToken}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Supabase query failed.");
  }

  return (await response.json()) as T;
}

export async function fetchDashboardData(userId: string): Promise<DashboardPayload> {
  const baseFilter = `user_id=eq.${userId}`;

  const [profiles, analytics, badges, tests, insights] = await Promise.all([
    supabaseGet<ProfileRow[]>(`user_profiles?select=*&${baseFilter}&limit=1`),
    supabaseGet<AnalyticsRow[]>(`user_analytics?select=*&${baseFilter}&limit=1`),
    supabaseGet<BadgeRow[]>(
      `user_badges?select=id,badge_name,badge_detail&${baseFilter}&order=earned_at.desc&limit=6`
    ),
    supabaseGet<TestRow[]>(
      `test_attempts?select=id,test_name,attempted_at,score,percentile&${baseFilter}&order=attempted_at.desc&limit=8`
    ),
    supabaseGet<InsightRow[]>(
      `ai_insights?select=id,insight&${baseFilter}&order=created_at.desc&limit=6`
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

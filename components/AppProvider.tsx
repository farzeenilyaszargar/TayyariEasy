"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchCatalog, fetchMyAttempts, fetchMyBadges, fetchProfile } from "@/lib/api";
import { supabase } from "@/lib/supabase/client";
import type { Attempt, EarnedBadge, Profile, Question, TestPaper } from "@/lib/types";

interface AppState {
  ready: boolean; // auth + catalogue loaded
  user: Profile | null;
  attempts: Attempt[];
  earnedBadges: EarnedBadge[];
  tests: TestPaper[];
  testMap: Record<string, TestPaper>;
  questionMap: Record<string, Question>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [tests, setTests] = useState<TestPaper[]>([]);
  const [questionMap, setQuestionMap] = useState<Record<string, Question>>({});

  const loadUser = useCallback(async (id: string | null) => {
    if (!id) {
      setUser(null); setAttempts([]); setEarnedBadges([]);
      return;
    }
    const [p, a, b] = await Promise.all([fetchProfile(id), fetchMyAttempts(), fetchMyBadges()]);
    setUser(p); setAttempts(a); setEarnedBadges(b);
  }, []);

  useEffect(() => {
    const db = supabase();
    let first = true;
    const catalog = fetchCatalog().then((c) => { setTests(c.tests); setQuestionMap(c.questionMap); });

    const { data: sub } = db.auth.onAuthStateChange((_event, session) => {
      const id = session?.user.id ?? null;
      setUserId((prev) => {
        if (prev !== id || first) {
          // defer: Supabase recommends not awaiting inside the auth callback
          setTimeout(() => {
            Promise.all([catalog, loadUser(id)]).catch(console.error).finally(() => setReady(true));
          }, 0);
        }
        first = false;
        return id;
      });
    });
    return () => sub.subscription.unsubscribe();
  }, [loadUser]);

  const value: AppState = {
    ready,
    user,
    attempts,
    earnedBadges,
    tests,
    testMap: Object.fromEntries(tests.map((t) => [t.id, t])),
    questionMap,
    refresh: () => loadUser(userId),
    async logout() {
      await supabase().auth.signOut();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppProvider");
  return v;
}

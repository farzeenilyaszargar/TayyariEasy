"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { store, uid } from "@/lib/store";
import type { Attempt, Plan, User } from "@/lib/types";

interface AppState {
  ready: boolean;
  user: User | null;
  attempts: Attempt[];
  // Demo sign-in. Replace with Supabase Auth (phone OTP, Google, email) later.
  login: (name: string, email: string) => void;
  logout: () => void;
  setPlan: (plan: Plan) => void;
  refresh: () => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  const refresh = useCallback(() => {
    const u = store.getUser();
    setUser(u);
    setAttempts(u ? store.getAttempts(u.id) : []);
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
  }, [refresh]);

  const value: AppState = {
    ready,
    user,
    attempts,
    refresh,
    login(name, email) {
      store.saveUser({ id: uid(), name, email, plan: "free", createdAt: new Date().toISOString() });
      refresh();
    },
    logout() {
      store.clearUser();
      refresh();
    },
    setPlan(plan) {
      store.setPlan(plan);
      refresh();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppProvider");
  return v;
}

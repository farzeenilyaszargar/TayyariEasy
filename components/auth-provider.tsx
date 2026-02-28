"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  clearStoredSession,
  consumeOAuthSessionFromHash,
  fetchSupabaseUser,
  getStoredSession,
  signOutSupabase
} from "@/lib/supabase-auth";

type UserState = {
  name: string;
  points: number;
};

type AuthContextType = {
  isLoggedIn: boolean;
  user: UserState;
  login: () => void;
  logout: () => Promise<void> | void;
};

const defaultUser: UserState = {
  name: "Aspirant",
  points: 10320
};

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: defaultUser,
  login: () => undefined,
  logout: () => undefined
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserState>(defaultUser);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let alive = true;
    consumeOAuthSessionFromHash();

    const hydrate = async () => {
      const session = getStoredSession();
      if (!session) {
        if (alive) {
          setIsLoggedIn(false);
          setUser(defaultUser);
        }
        return;
      }

      if (session.expiresAt <= Date.now()) {
        clearStoredSession();
        if (alive) {
          setIsLoggedIn(false);
          setUser(defaultUser);
        }
        return;
      }

      try {
        const supabaseUser = await fetchSupabaseUser(session.accessToken);
        const name =
          supabaseUser.user_metadata?.full_name ||
          supabaseUser.user_metadata?.name ||
          supabaseUser.email ||
          supabaseUser.phone ||
          defaultUser.name;

        if (alive) {
          setIsLoggedIn(true);
          setUser({
            name,
            points: defaultUser.points
          });
        }
      } catch {
        clearStoredSession();
        if (alive) {
          setIsLoggedIn(false);
          setUser(defaultUser);
        }
      }
    };

    void hydrate();

    return () => {
      alive = false;
    };
  }, []);

  const login = () => {
    window.location.assign("/login");
  };

  const logout = async () => {
    const session = getStoredSession();
    if (session) {
      await signOutSupabase(session.accessToken);
    }
    clearStoredSession();
    setIsLoggedIn(false);
    setUser(defaultUser);
    window.location.assign("/");
  };

  const value = useMemo(
    () => ({
      isLoggedIn,
      user,
      login,
      logout
    }),
    [isLoggedIn, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

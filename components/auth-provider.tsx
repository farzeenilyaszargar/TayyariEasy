"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  clearStoredSession,
  consumeOAuthSessionFromHash,
  fetchSupabaseUser,
  getStoredSession,
  signOutSupabase
} from "@/lib/supabase-auth";
import { fetchOwnProfile } from "@/lib/supabase-db";

type UserState = {
  id: string | null;
  name: string;
  points: number;
  avatarUrl: string | null;
};

type AuthContextType = {
  isLoggedIn: boolean;
  user: UserState;
  login: () => void;
  logout: () => Promise<void> | void;
};

const defaultUser: UserState = {
  id: null,
  name: "Aspirant",
  points: 0,
  avatarUrl: null
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
        const metadata = supabaseUser.user_metadata ?? {};
        const name =
          metadata.full_name ||
          metadata.name ||
          supabaseUser.email ||
          supabaseUser.phone ||
          defaultUser.name;
        const avatarUrl = metadata.avatar_url || metadata.picture || null;
        let points = 0;
        let profileName: string = name;
        let profileAvatar: string | null = avatarUrl;

        try {
          const profile = await fetchOwnProfile(supabaseUser.id);
          if (profile) {
            points = profile.points;
            profileName = profile.full_name || profileName;
            profileAvatar = profile.avatar_url || profileAvatar;
          }
        } catch {
          points = 0;
        }

        if (alive) {
          setIsLoggedIn(true);
          setUser({
            id: supabaseUser.id ?? null,
            name: profileName,
            points,
            avatarUrl: profileAvatar
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

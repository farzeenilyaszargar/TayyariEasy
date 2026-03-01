"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  clearStoredSession,
  consumeOAuthSessionFromHash,
  fetchSupabaseUser,
  getStoredSession,
  signOutSupabase
} from "@/lib/supabase-auth";
import { fetchOwnProfile } from "@/lib/supabase-db";
import type { SupabaseUser } from "@/lib/supabase-auth";

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
  refreshUser: () => Promise<void> | void;
};

const defaultUser: UserState = {
  id: null,
  name: "Aspirant",
  points: 0,
  avatarUrl: null
};

function normalizeAvatarUrl(raw: unknown) {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) {
    return null;
  }
  if (value.startsWith("//")) {
    return `https:${value}`;
  }
  return value;
}

function resolveAvatarFromSupabaseUser(supabaseUser: SupabaseUser) {
  const metadata = supabaseUser.user_metadata ?? {};
  const metadataCandidate =
    normalizeAvatarUrl(metadata.avatar_url) ||
    normalizeAvatarUrl(metadata.picture) ||
    normalizeAvatarUrl(metadata.profile_image_url) ||
    normalizeAvatarUrl(metadata.photo_url);

  if (metadataCandidate) {
    return metadataCandidate;
  }

  const identities = Array.isArray(supabaseUser.identities) ? supabaseUser.identities : [];
  for (const identity of identities) {
    const data = identity.identity_data ?? {};
    const candidate = normalizeAvatarUrl(data.avatar_url) || normalizeAvatarUrl(data.picture);
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: defaultUser,
  login: () => undefined,
  logout: () => undefined,
  refreshUser: () => undefined
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserState>(defaultUser);

  const hydrateUser = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }
    const session = getStoredSession();
    if (!session) {
      setIsLoggedIn(false);
      setUser(defaultUser);
      return;
    }

    if (session.expiresAt <= Date.now()) {
      clearStoredSession();
      setIsLoggedIn(false);
      setUser(defaultUser);
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
      const avatarUrl = resolveAvatarFromSupabaseUser(supabaseUser);
      let points = 0;
      let profileName: string = name;
      let profileAvatar: string | null = avatarUrl;

      try {
        const profile = await fetchOwnProfile(supabaseUser.id);
        if (profile) {
          points = profile.points;
          profileName = profile.full_name || profileName;
          profileAvatar = normalizeAvatarUrl(profile.avatar_url) || profileAvatar;
        }
      } catch {
        points = 0;
      }

      setIsLoggedIn(true);
      setUser({
        id: supabaseUser.id ?? null,
        name: profileName,
        points,
        avatarUrl: profileAvatar
      });
    } catch {
      clearStoredSession();
      setIsLoggedIn(false);
      setUser(defaultUser);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    consumeOAuthSessionFromHash();

    const run = async () => {
      if (!alive) {
        return;
      }
      await hydrateUser();
    };

    void run();

    return () => {
      alive = false;
    };
  }, [hydrateUser]);

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
      logout,
      refreshUser: hydrateUser
    }),
    [isLoggedIn, user, hydrateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

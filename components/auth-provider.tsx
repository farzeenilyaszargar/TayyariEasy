"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  clearStoredSession,
  consumeOAuthSessionFromHash,
  fetchSupabaseUser,
  getStoredSession,
  signInWithEmail,
  signUpWithEmail,
  signOutSupabase
} from "@/lib/supabase-auth";
import { startGoogleOAuth } from "@/lib/supabase-auth";
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
  logout: () => Promise<void> | void;
  refreshUser: () => Promise<void> | void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
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
  logout: () => undefined,
  refreshUser: () => undefined,
  signIn: async () => undefined,
  signUp: async () => ({ needsEmailConfirmation: false }),
  signInWithGoogle: async () => undefined
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

  const signIn = async (email: string, password: string) => {
    await signInWithEmail(email, password);
    await hydrateUser();
  };

  const signUp = async (email: string, password: string) => {
    const session = await signUpWithEmail(email, password);
    if (session) {
      await hydrateUser();
    }
    return { needsEmailConfirmation: !session };
  };

  const signInWithGoogle = async (redirectTo?: string) => {
    const target = redirectTo || `${window.location.origin}/tests`;
    await startGoogleOAuth(target);
  };

  const value = useMemo(
    () => ({
      isLoggedIn,
      user,
      logout,
      refreshUser: hydrateUser,
      signIn,
      signUp,
      signInWithGoogle
    }),
    [isLoggedIn, user, hydrateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

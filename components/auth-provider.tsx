"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type UserState = {
  name: string;
  points: number;
};

type AuthContextType = {
  isLoggedIn: boolean;
  user: UserState;
  login: () => void;
  logout: () => void;
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

const AUTH_KEY = "tayyarieasy-auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const persisted = window.localStorage.getItem(AUTH_KEY);
    if (persisted === "1") {
      setIsLoggedIn(true);
    }
  }, []);

  const login = () => {
    setIsLoggedIn(true);
    window.localStorage.setItem(AUTH_KEY, "1");
  };

  const logout = () => {
    setIsLoggedIn(false);
    window.localStorage.setItem(AUTH_KEY, "0");
  };

  const value = useMemo(
    () => ({
      isLoggedIn,
      user: defaultUser,
      login,
      logout
    }),
    [isLoggedIn]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

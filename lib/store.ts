// Local data layer. Every read/write goes through here so it can be swapped
// for Supabase (see supabase/schema.sql) without touching the pages.
import type { Attempt, Plan, User } from "./types";

const USER_KEY = "tayyari:user";
const ATTEMPTS_KEY = "tayyari:attempts";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked */
  }
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const store = {
  getUser: (): User | null => read<User | null>(USER_KEY, null),
  saveUser: (user: User) => write(USER_KEY, user),
  clearUser: () => window.localStorage.removeItem(USER_KEY),
  setPlan(plan: Plan) {
    const u = store.getUser();
    if (u) store.saveUser({ ...u, plan });
  },

  getAttempts: (userId: string): Attempt[] =>
    read<Attempt[]>(ATTEMPTS_KEY, []).filter((a) => a.userId === userId),
  getAttempt: (id: string): Attempt | undefined =>
    read<Attempt[]>(ATTEMPTS_KEY, []).find((a) => a.id === id),
  saveAttempt(attempt: Attempt) {
    const all = read<Attempt[]>(ATTEMPTS_KEY, []);
    const i = all.findIndex((a) => a.id === attempt.id);
    if (i >= 0) all[i] = attempt;
    else all.push(attempt);
    write(ATTEMPTS_KEY, all);
  },
  deleteAttempt(id: string) {
    write(ATTEMPTS_KEY, read<Attempt[]>(ATTEMPTS_KEY, []).filter((a) => a.id !== id));
  },
};

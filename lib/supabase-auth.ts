"use client";

export type SupabaseUser = {
  id: string;
  email?: string;
  phone?: string;
  identities?: Array<{
    identity_data?: {
      avatar_url?: string;
      picture?: string;
      full_name?: string;
      name?: string;
    };
    provider?: string;
  }>;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
    profile_image_url?: string;
    photo_url?: string;
  };
};

type SessionPayload = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user?: SupabaseUser;
};

export type StoredSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: SupabaseUser | null;
};

const SESSION_KEY = "tayyari-supabase-session";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function assertConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
}

function getHeaders(token?: string) {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY ?? "",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export function getSupabaseUrl() {
  return SUPABASE_URL ?? "";
}

export function getSupabaseAnonKey() {
  return SUPABASE_ANON_KEY ?? "";
}

function saveSession(payload: SessionPayload) {
  const session: StoredSession = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
    user: payload.user ?? null
  };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getStoredSession(): StoredSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.expiresAt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(SESSION_KEY);
}

export function getOAuthErrorFromHash() {
  if (typeof window === "undefined") {
    return null;
  }
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) {
    return null;
  }
  const params = new URLSearchParams(hash);
  return params.get("error_description") ?? params.get("error");
}

export function consumeOAuthSessionFromHash() {
  if (typeof window === "undefined") {
    return null;
  }

  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) {
    return null;
  }

  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const expiresIn = params.get("expires_in");
  const tokenType = params.get("token_type") ?? "bearer";

  if (!accessToken || !refreshToken || !expiresIn) {
    return null;
  }

  const session = saveSession({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: Number(expiresIn),
    token_type: tokenType
  });

  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  return session;
}

export async function fetchSupabaseUser(accessToken: string) {
  assertConfig();

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: getHeaders(accessToken)
  });

  if (!response.ok) {
    throw new Error("Unable to fetch authenticated user.");
  }

  return (await response.json()) as SupabaseUser;
}

export async function startGoogleOAuth(redirectTo: string) {
  assertConfig();
  const target = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
  window.location.assign(target);
}

export async function sendPhoneOtp(phone: string) {
  assertConfig();

  const response = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      phone,
      create_user: true
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to send OTP.");
  }
}

export async function verifyPhoneOtp(phone: string, token: string) {
  assertConfig();

  const response = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      phone,
      token,
      type: "sms"
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to verify OTP.");
  }

  const payload = (await response.json()) as SessionPayload;
  return saveSession(payload);
}

export async function signOutSupabase(accessToken: string) {
  if (!SUPABASE_URL) {
    return;
  }

  await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: "POST",
    headers: getHeaders(accessToken)
  }).catch(() => undefined);
}

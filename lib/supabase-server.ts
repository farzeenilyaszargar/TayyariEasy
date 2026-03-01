import "server-only";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

type RestMethod = "GET" | "POST" | "PATCH" | "DELETE";

function assertServerConfig() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing server Supabase config. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
}

export function getSupabaseServerUrl() {
  assertServerConfig();
  return SUPABASE_URL as string;
}

function getServiceHeaders(extra?: Record<string, string>) {
  assertServerConfig();
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY as string,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...(extra ?? {})
  };
}

export async function supabaseRest<T>(path: string, method: RestMethod = "GET", body?: unknown, prefer?: string): Promise<T> {
  const url = `${getSupabaseServerUrl()}/rest/v1/${path}`;
  const response = await fetch(url, {
    method,
    headers: getServiceHeaders(prefer ? { Prefer: prefer } : undefined),
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Supabase REST request failed: ${method} ${path}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function verifySupabaseAccessToken(accessToken: string) {
  assertServerConfig();
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY as string,
      Authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { id: string; email?: string; phone?: string; user_metadata?: Record<string, unknown> };
  return payload;
}

export function getInternalIngestToken() {
  const token = process.env.INTERNAL_INGEST_TOKEN;
  if (!token) {
    throw new Error("Missing INTERNAL_INGEST_TOKEN env var.");
  }
  return token;
}

export function getAdminReviewToken() {
  const token = process.env.ADMIN_REVIEW_TOKEN;
  if (!token) {
    throw new Error("Missing ADMIN_REVIEW_TOKEN env var.");
  }
  return token;
}

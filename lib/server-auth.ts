import { NextRequest } from "next/server";
import { getAdminReviewToken, getInternalIngestToken, verifySupabaseAccessToken } from "@/lib/supabase-server";

function getBearerToken(request: NextRequest) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) {
    return "";
  }
  return auth.slice(7).trim();
}

export async function getAuthenticatedUser(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) {
    return null;
  }
  return verifySupabaseAccessToken(token);
}

export function assertInternalIngestAuth(request: NextRequest) {
  const token = request.headers.get("x-internal-token") || "";
  return token.length > 0 && token === getInternalIngestToken();
}

export function assertAdminReviewAuth(request: NextRequest) {
  const token = request.headers.get("x-admin-token") || "";
  return token.length > 0 && token === getAdminReviewToken();
}

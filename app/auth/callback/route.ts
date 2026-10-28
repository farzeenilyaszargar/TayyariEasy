import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Landing point for Google OAuth and email magic links.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/papers";
  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/papers", url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}

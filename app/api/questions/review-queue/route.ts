import { NextRequest, NextResponse } from "next/server";
import { assertAdminReviewAuth } from "@/lib/server-auth";
import { supabaseRest } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    if (!assertAdminReviewAuth(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "open";
    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") || 50)));

    const rows = await supabaseRest<Array<Record<string, unknown>>>(
      `question_review_queue?select=id,question_id,reason_codes,priority,assigned_to,status,review_notes,created_at,updated_at,question_bank!inner(id,subject,topic,subtopic,difficulty,source_kind,quality_score,stem_markdown)&status=eq.${status}&order=priority.asc,created_at.asc&limit=${limit}`,
      "GET"
    );

    return NextResponse.json({ items: rows });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load review queue."
      },
      { status: 500 }
    );
  }
}

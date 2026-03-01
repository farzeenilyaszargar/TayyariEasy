import { NextRequest, NextResponse } from "next/server";
import { assertInternalIngestAuth } from "@/lib/server-auth";
import { supabaseRest } from "@/lib/supabase-server";

type DecisionBody = {
  questionId?: string;
  decision?: "approved" | "rejected";
  notes?: string;
  publish?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    if (!assertInternalIngestAuth(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as DecisionBody;
    if (!body.questionId || !body.decision) {
      return NextResponse.json({ error: "questionId and decision are required." }, { status: 400 });
    }

    await Promise.all([
      supabaseRest(
        `question_bank?id=eq.${body.questionId}`,
        "PATCH",
        {
          review_status: body.decision,
          is_published: body.decision === "approved" ? Boolean(body.publish ?? true) : false,
          updated_at: new Date().toISOString()
        },
        "return=minimal"
      ),
      supabaseRest(
        `question_review_queue?question_id=eq.${body.questionId}&status=eq.open`,
        "PATCH",
        {
          status: body.decision,
          review_notes: body.notes || null,
          updated_at: new Date().toISOString()
        },
        "return=minimal"
      )
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to apply review decision."
      },
      { status: 500 }
    );
  }
}

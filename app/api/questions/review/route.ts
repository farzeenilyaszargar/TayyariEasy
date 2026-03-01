import { NextRequest, NextResponse } from "next/server";
import { assertAdminReviewAuth } from "@/lib/server-auth";
import { supabaseRest } from "@/lib/supabase-server";

type ReviewBody = {
  queueId?: string;
  action?: "approved" | "rejected";
  notes?: string;
  publish?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    if (!assertAdminReviewAuth(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as ReviewBody;
    if (!body.queueId || !body.action) {
      return NextResponse.json({ error: "queueId and action are required." }, { status: 400 });
    }

    const queueRows = await supabaseRest<Array<{ id: string; question_id: string }>>(
      `question_review_queue?select=id,question_id&id=eq.${body.queueId}&limit=1`,
      "GET"
    );
    const queue = queueRows[0];

    if (!queue) {
      return NextResponse.json({ error: "Queue item not found." }, { status: 404 });
    }

    const questionReviewStatus = body.action === "approved" ? "approved" : "rejected";

    await Promise.all([
      supabaseRest(
        `question_review_queue?id=eq.${queue.id}`,
        "PATCH",
        {
          status: body.action,
          review_notes: body.notes || null,
          updated_at: new Date().toISOString()
        },
        "return=minimal"
      ),
      supabaseRest(
        `question_bank?id=eq.${queue.question_id}`,
        "PATCH",
        {
          review_status: questionReviewStatus,
          is_published: body.action === "approved" ? Boolean(body.publish ?? true) : false,
          updated_at: new Date().toISOString()
        },
        "return=minimal"
      )
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process review decision."
      },
      { status: 500 }
    );
  }
}

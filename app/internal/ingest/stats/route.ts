import { NextRequest, NextResponse } from "next/server";
import { assertInternalIngestAuth } from "@/lib/server-auth";
import { supabaseRest } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    if (!assertInternalIngestAuth(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await supabaseRest<Array<{ id: string; is_published: boolean }>>(
      "question_bank?select=id,is_published",
      "GET"
    );

    const total = rows.length;
    const published = rows.filter((row) => row.is_published).length;

    return NextResponse.json({ ok: true, total, published });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch ingestion stats."
      },
      { status: 500 }
    );
  }
}

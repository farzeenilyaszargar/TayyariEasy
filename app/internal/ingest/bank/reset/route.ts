import { NextRequest, NextResponse } from "next/server";
import { assertInternalIngestAuth } from "@/lib/server-auth";
import { supabaseRest } from "@/lib/supabase-server";

type ResetBody = {
  preserveSources?: boolean;
  preserveBlueprints?: boolean;
  dryRun?: boolean;
};

async function getCounts() {
  const [questions, instances, sources, documents] = await Promise.all([
    supabaseRest<Array<{ id: string }>>("question_bank?select=id", "GET"),
    supabaseRest<Array<{ id: string }>>("test_instances?select=id", "GET"),
    supabaseRest<Array<{ id: string }>>("question_sources?select=id", "GET"),
    supabaseRest<Array<{ id: string }>>("source_documents?select=id", "GET")
  ]);

  return {
    questions: questions.length,
    testInstances: instances.length,
    sources: sources.length,
    sourceDocuments: documents.length
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!assertInternalIngestAuth(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as ResetBody;
    const preserveSources = body.preserveSources !== false;
    const preserveBlueprints = body.preserveBlueprints !== false;
    const dryRun = body.dryRun === true;

    const before = await getCounts();
    if (dryRun) {
      return NextResponse.json({ ok: true, dryRun: true, before });
    }

    // Remove launched tests first so new bank rebuild does not keep stale instances.
    await supabaseRest("test_instances?id=not.is.null", "DELETE", undefined, "return=minimal");
    await supabaseRest("question_bank?id=not.is.null", "DELETE", undefined, "return=minimal");

    if (!preserveSources) {
      await supabaseRest("source_documents?id=not.is.null", "DELETE", undefined, "return=minimal");
      await supabaseRest("question_sources?id=not.is.null", "DELETE", undefined, "return=minimal");
    }

    if (!preserveBlueprints) {
      await supabaseRest("test_blueprints?id=not.is.null", "DELETE", undefined, "return=minimal");
    }

    const after = await getCounts();
    return NextResponse.json({
      ok: true,
      reset: true,
      preserveSources,
      preserveBlueprints,
      before,
      after
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to reset question bank."
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { assertInternalIngestAuth } from "@/lib/server-auth";
import { supabaseRest } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    if (!assertInternalIngestAuth(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await supabaseRest<
      Array<{
        id: string;
        is_published: boolean;
        subject: "Physics" | "Chemistry" | "Mathematics";
        topic: string;
        difficulty: "easy" | "medium" | "hard";
        exam_phase: "Main" | "Advanced" | null;
        diagram_image_url: string | null;
      }>
    >(
      "question_bank?select=id,is_published,subject,topic,difficulty,exam_phase,diagram_image_url",
      "GET"
    );

    const total = rows.length;
    const published = rows.filter((row) => row.is_published).length;
    const withDiagrams = rows.filter((row) => Boolean(row.diagram_image_url)).length;
    const bySubject = {
      Physics: rows.filter((row) => row.subject === "Physics").length,
      Chemistry: rows.filter((row) => row.subject === "Chemistry").length,
      Mathematics: rows.filter((row) => row.subject === "Mathematics").length
    };
    const byDifficulty = {
      easy: rows.filter((row) => row.difficulty === "easy").length,
      medium: rows.filter((row) => row.difficulty === "medium").length,
      hard: rows.filter((row) => row.difficulty === "hard").length
    };
    const byExamPhase = {
      Main: rows.filter((row) => row.exam_phase === "Main").length,
      Advanced: rows.filter((row) => row.exam_phase === "Advanced").length
    };
    const byTopic = rows.reduce<Record<string, number>>((acc, row) => {
      const key = `${row.subject}::${row.topic}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      ok: true,
      total,
      published,
      withDiagrams,
      bySubject,
      byDifficulty,
      byExamPhase,
      byTopic
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch ingestion stats."
      },
      { status: 500 }
    );
  }
}

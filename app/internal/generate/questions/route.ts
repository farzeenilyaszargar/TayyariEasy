import { NextRequest, NextResponse } from "next/server";
import { assertInternalIngestAuth } from "@/lib/server-auth";
import { deepseekChat, hasDeepSeekConfig } from "@/lib/deepseek";
import { supabaseRest } from "@/lib/supabase-server";

type GenerateBody = {
  subject?: "Physics" | "Chemistry" | "Mathematics";
  topic?: string;
  subtopic?: string;
  difficulty?: "easy" | "medium" | "hard";
  count?: number;
};

export async function POST(request: NextRequest) {
  try {
    if (!assertInternalIngestAuth(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as GenerateBody;
    const subject = body.subject;
    const topic = body.topic?.trim();
    const subtopic = body.subtopic?.trim();
    const difficulty = body.difficulty || "medium";
    const count = Math.min(10, Math.max(1, Number(body.count || 5)));

    if (!subject || !topic) {
      return NextResponse.json({ error: "subject and topic are required." }, { status: 400 });
    }

    const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

    const createdJobs = await supabaseRest<Array<{ id: string }>>(
      "question_generation_jobs",
      "POST",
      [
        {
          target_subject: subject,
          target_topic: topic,
          target_subtopic: subtopic || null,
          target_difficulty: difficulty,
          requested_count: count,
          model,
          status: "running",
          updated_at: new Date().toISOString()
        }
      ],
      "return=representation"
    );

    const jobId = createdJobs[0]?.id;

    if (!hasDeepSeekConfig()) {
      await supabaseRest(`question_generation_jobs?id=eq.${jobId}`, "PATCH", { status: "failed", updated_at: new Date().toISOString() }, "return=minimal");
      return NextResponse.json({ error: "DeepSeek not configured." }, { status: 500 });
    }

    const prompt = [
      "Generate strictly valid JSON array with no markdown fences.",
      `Count: ${count}`,
      `Subject: ${subject}`,
      `Topic: ${topic}`,
      `Subtopic: ${subtopic || "General"}`,
      `Difficulty: ${difficulty}`,
      "Question types allowed: mcq_single or integer.",
      "Each item fields:",
      "questionType, stemMarkdown, subject, topic, subtopic, difficulty, options(for mcq), answer(answerType,correctOption/correctInteger), solutionMarkdown"
    ].join("\n");

    const raw = await deepseekChat({
      messages: [
        {
          role: "system",
          content: "You generate JEE-style questions in strict JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4,
      maxTokens: 2200
    });

    let parsed: Array<Record<string, unknown>> = [];
    try {
      parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
    } catch {
      await supabaseRest(`question_generation_jobs?id=eq.${jobId}`, "PATCH", { status: "failed", updated_at: new Date().toISOString() }, "return=minimal");
      return NextResponse.json({ error: "Model returned invalid JSON." }, { status: 500 });
    }

    await supabaseRest(`question_generation_jobs?id=eq.${jobId}`, "PATCH", { status: "completed", updated_at: new Date().toISOString() }, "return=minimal");

    return NextResponse.json({ ok: true, jobId, items: parsed });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Generation request failed."
      },
      { status: 500 }
    );
  }
}

import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { assertInternalIngestAuth } from "@/lib/server-auth";
import { deepseekChat, hasDeepSeekConfig } from "@/lib/deepseek";
import { vetQuestionWithAI } from "@/lib/question-vetting";
import { supabaseRest } from "@/lib/supabase-server";

type GenerateBody = {
  subject?: "Physics" | "Chemistry" | "Mathematics";
  topic?: string;
  subtopic?: string;
  difficulty?: "easy" | "medium" | "hard";
  count?: number;
  examPhase?: "Main" | "Advanced";
  examYear?: number;
  autoVet?: boolean;
};

type GeneratedItem = {
  questionType: "mcq_single" | "integer";
  stemMarkdown: string;
  stemLatex?: string | null;
  subject: "Physics" | "Chemistry" | "Mathematics";
  topic: string;
  subtopic?: string | null;
  difficulty: "easy" | "medium" | "hard";
  options?: Array<{ key: "A" | "B" | "C" | "D"; text: string; latex?: string | null }>;
  answer: {
    answerType: "option_key" | "integer_value";
    correctOption?: "A" | "B" | "C" | "D";
    correctInteger?: number;
    solutionMarkdown?: string;
    solutionLatex?: string;
  };
  diagramImageUrl?: string | null;
  diagramCaption?: string | null;
};

function extractJsonArray(raw: string) {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    const first = cleaned.indexOf("[");
    const last = cleaned.lastIndexOf("]");
    if (first >= 0 && last > first) {
      try {
        const parsed = JSON.parse(cleaned.slice(first, last + 1)) as unknown;
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }
}

function normalizeGenerated(item: Record<string, unknown>, fallback: Omit<GenerateBody, "count" | "autoVet">): GeneratedItem | null {
  const questionType = item.questionType === "integer" ? "integer" : item.questionType === "mcq_single" ? "mcq_single" : "mcq_single";
  const stemMarkdown = String(item.stemMarkdown || "").trim();
  const subject = item.subject === "Physics" || item.subject === "Chemistry" || item.subject === "Mathematics" ? item.subject : fallback.subject;
  const topic = String(item.topic || fallback.topic || "").trim();
  const difficulty = item.difficulty === "easy" || item.difficulty === "medium" || item.difficulty === "hard" ? item.difficulty : fallback.difficulty || "medium";

  if (!stemMarkdown || !subject || !topic) {
    return null;
  }

  const answerRaw = (item.answer || {}) as Record<string, unknown>;
  const answer: GeneratedItem["answer"] = {
    answerType: answerRaw.answerType === "integer_value" ? "integer_value" : "option_key",
    correctOption: answerRaw.correctOption ? String(answerRaw.correctOption).toUpperCase() as "A" | "B" | "C" | "D" : undefined,
    correctInteger:
      answerRaw.correctInteger === null || answerRaw.correctInteger === undefined
        ? undefined
        : Number(answerRaw.correctInteger),
    solutionMarkdown: answerRaw.solutionMarkdown ? String(answerRaw.solutionMarkdown).trim() : undefined,
    solutionLatex: answerRaw.solutionLatex ? String(answerRaw.solutionLatex).trim() : undefined
  };

  const options = Array.isArray(item.options)
    ? item.options
        .map((raw) => {
          const src = raw as Record<string, unknown>;
          const key = String(src.key || "").toUpperCase();
          if (!["A", "B", "C", "D"].includes(key)) {
            return null;
          }
          return {
            key: key as "A" | "B" | "C" | "D",
            text: String(src.text || "").trim(),
            latex: src.latex ? String(src.latex).trim() : null
          };
        })
        .filter(Boolean)
    : [];

  if (questionType === "mcq_single" && options.length !== 4) {
    return null;
  }

  if (questionType === "integer") {
    answer.answerType = "integer_value";
    if (!Number.isFinite(Number(answer.correctInteger))) {
      return null;
    }
  }

  if (questionType === "mcq_single") {
    answer.answerType = "option_key";
    if (!answer.correctOption || !["A", "B", "C", "D"].includes(answer.correctOption)) {
      return null;
    }
  }

  return {
    questionType,
    stemMarkdown,
    stemLatex: item.stemLatex ? String(item.stemLatex).trim() : null,
    subject,
    topic,
    subtopic: item.subtopic ? String(item.subtopic).trim() : fallback.subtopic || null,
    difficulty,
    options: options as GeneratedItem["options"],
    answer,
    diagramImageUrl: item.diagramImageUrl ? String(item.diagramImageUrl).trim() : null,
    diagramCaption: item.diagramCaption ? String(item.diagramCaption).trim() : null
  };
}

function fingerprintForGenerated(item: GeneratedItem) {
  const base = [
    item.questionType,
    item.subject,
    item.topic,
    item.subtopic || "",
    item.stemMarkdown.toLowerCase().replace(/\s+/g, " "),
    JSON.stringify(item.options || []),
    JSON.stringify(item.answer)
  ].join("|");
  return createHash("sha256").update(base).digest("hex").slice(0, 40);
}

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
    const count = Math.min(20, Math.max(1, Number(body.count || 5)));
    const examPhase = body.examPhase || "Main";
    const examYear = Number(body.examYear || 2025);
    const autoVet = body.autoVet !== false;

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
      "Generate strict JSON array only.",
      `Count: ${count}`,
      `Subject: ${subject}`,
      `Topic: ${topic}`,
      `Subtopic: ${subtopic || "General"}`,
      `Difficulty: ${difficulty}`,
      `Exam phase style: ${examPhase}`,
      "Question types: mix of mcq_single and integer.",
      "For mcq_single, provide exactly 4 options A-D and one correct option.",
      "For integer, provide exact integer answer.",
      "Add concise solutionMarkdown for each.",
      "If a question needs a diagram, set diagramImageUrl as placeholder like https://example.com/diagrams/q123.png and give diagramCaption.",
      "Schema per item:",
      '{"questionType":"mcq_single|integer","stemMarkdown":"...","stemLatex":null,"subject":"Physics|Chemistry|Mathematics","topic":"...","subtopic":"...","difficulty":"easy|medium|hard","options":[{"key":"A","text":"...","latex":null}],"answer":{"answerType":"option_key|integer_value","correctOption":"A","correctInteger":null,"solutionMarkdown":"...","solutionLatex":null},"diagramImageUrl":null,"diagramCaption":null}'
    ].join("\n");

    const raw = await deepseekChat({
      messages: [
        {
          role: "system",
          content: "You generate high-quality JEE questions. Return strict JSON only and never markdown fences."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.35,
      maxTokens: 3600
    });

    const parsed = extractJsonArray(raw);
    if (parsed.length === 0) {
      await supabaseRest(`question_generation_jobs?id=eq.${jobId}`, "PATCH", { status: "failed", updated_at: new Date().toISOString() }, "return=minimal");
      return NextResponse.json({ error: "Model returned invalid JSON array." }, { status: 500 });
    }

    const normalized: GeneratedItem[] = parsed
      .map((item) => normalizeGenerated(item as Record<string, unknown>, { subject, topic, subtopic, difficulty, examPhase, examYear }))
      .filter(Boolean) as GeneratedItem[];

    const vetted = autoVet
      ? await Promise.all(
          normalized.map((item) =>
            vetQuestionWithAI({
              questionType: item.questionType,
              stemMarkdown: item.stemMarkdown,
              stemLatex: item.stemLatex,
              subject: item.subject,
              topic: item.topic,
              subtopic: item.subtopic,
              difficulty: item.difficulty,
              options: item.options || [],
              answer: item.answer,
              diagramImageUrl: item.diagramImageUrl || null,
              diagramCaption: item.diagramCaption || null
            })
          )
        )
      : [];

    const items = normalized.map((item, idx) => {
      const checked = vetted[idx];
      const source = checked
        ? {
            ...item,
            stemMarkdown: checked.stemMarkdown,
            stemLatex: checked.stemLatex,
            difficulty: checked.difficulty,
            options: checked.options,
            answer: checked.answer,
            diagramImageUrl: checked.diagramImageUrl,
            diagramCaption: checked.diagramCaption
          }
        : item;

      return {
        dedupeFingerprint: fingerprintForGenerated(source),
        questionType: source.questionType,
        stemMarkdown: source.stemMarkdown,
        stemLatex: source.stemLatex || undefined,
        subject: source.subject,
        topic: source.topic,
        subtopic: source.subtopic || undefined,
        difficulty: source.difficulty,
        sourceKind: "ai_generated" as const,
        examYear,
        examPhase,
        marks: 4,
        negativeMarks: 1,
        qualityScore: checked?.qualityScore ?? 0.78,
        reviewStatus: checked?.reviewStatus || "needs_review",
        publish: checked ? checked.reviewStatus === "auto_pass" : false,
        useAiVetting: false,
        diagramImageUrl: source.diagramImageUrl || undefined,
        diagramCaption: source.diagramCaption || undefined,
        options: source.questionType === "mcq_single" ? source.options : undefined,
        answer: source.answer
      };
    });

    await supabaseRest(`question_generation_jobs?id=eq.${jobId}`, "PATCH", { status: "completed", updated_at: new Date().toISOString() }, "return=minimal");

    return NextResponse.json({ ok: true, jobId, items, generated: items.length });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Generation request failed."
      },
      { status: 500 }
    );
  }
}

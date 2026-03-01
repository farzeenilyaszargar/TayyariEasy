import { NextRequest, NextResponse } from "next/server";
import { vetQuestionWithAI } from "@/lib/question-vetting";
import { assertInternalIngestAuth } from "@/lib/server-auth";
import { supabaseRest } from "@/lib/supabase-server";

type VetBody = {
  limit?: number;
  onlyUnvetted?: boolean;
  publishOnHighQuality?: boolean;
  minQualityToPublish?: number;
};

type QuestionRow = {
  id: string;
  question_type: "mcq_single" | "integer";
  stem_markdown: string;
  stem_latex: string | null;
  subject: "Physics" | "Chemistry" | "Mathematics";
  topic: string;
  subtopic: string | null;
  difficulty: "easy" | "medium" | "hard";
  source_kind: "historical" | "hard_curated" | "ai_generated";
  exam_year: number | null;
  exam_phase: "Main" | "Advanced" | null;
  marks: number;
  negative_marks: number;
  dedupe_fingerprint: string;
  is_published: boolean;
};

export async function POST(request: NextRequest) {
  try {
    if (!assertInternalIngestAuth(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as VetBody;
    const limit = Math.max(1, Math.min(80, Number(body.limit || 20)));
    const onlyUnvetted = body.onlyUnvetted !== false;
    const publishOnHighQuality = body.publishOnHighQuality === true;
    const minQualityToPublish = Math.max(0.6, Math.min(0.99, Number(body.minQualityToPublish || 0.88)));

    const filters = [
      "select=id,question_type,stem_markdown,stem_latex,subject,topic,subtopic,difficulty,source_kind,exam_year,exam_phase,marks,negative_marks,dedupe_fingerprint,is_published",
      "order=updated_at.asc",
      `limit=${limit}`
    ];

    if (onlyUnvetted) {
      filters.push("ai_vetted_at=is.null");
    }

    const rows = await supabaseRest<QuestionRow[]>(`question_bank?${filters.join("&")}`, "GET");
    if (rows.length === 0) {
      return NextResponse.json({ ok: true, processed: 0, updated: 0, published: 0 });
    }

    const inClause = rows.map((row) => `"${row.id}"`).join(",");
    const options = await supabaseRest<
      Array<{
        question_id: string;
        option_key: "A" | "B" | "C" | "D";
        option_text_markdown: string;
        option_latex: string | null;
      }>
    >(
      `question_options?select=question_id,option_key,option_text_markdown,option_latex&question_id=in.(${inClause})&order=option_key.asc`,
      "GET"
    );

    const answers = await supabaseRest<
      Array<{
        question_id: string;
        answer_type: "option_key" | "integer_value";
        correct_option: "A" | "B" | "C" | "D" | null;
        correct_integer: number | null;
        solution_markdown: string | null;
        solution_latex: string | null;
      }>
    >(
      `question_answers?select=question_id,answer_type,correct_option,correct_integer,solution_markdown,solution_latex&question_id=in.(${inClause})`,
      "GET"
    );

    const optionsByQ = new Map<string, typeof options>();
    for (const option of options) {
      const list = optionsByQ.get(option.question_id) || [];
      list.push(option);
      optionsByQ.set(option.question_id, list);
    }

    const answerByQ = new Map(answers.map((item) => [item.question_id, item]));

    let updated = 0;
    let published = 0;

    for (const row of rows) {
      const answer = answerByQ.get(row.id);
      if (!answer) {
        continue;
      }

      const vetted = await vetQuestionWithAI({
        questionType: row.question_type,
        stemMarkdown: row.stem_markdown,
        stemLatex: row.stem_latex,
        subject: row.subject,
        topic: row.topic,
        subtopic: row.subtopic,
        difficulty: row.difficulty,
        options: (optionsByQ.get(row.id) || []).map((opt) => ({
          key: opt.option_key,
          text: opt.option_text_markdown,
          latex: opt.option_latex
        })),
        answer: {
          answerType: answer.answer_type,
          correctOption: answer.correct_option || undefined,
          correctInteger: answer.correct_integer ?? undefined,
          solutionMarkdown: answer.solution_markdown || undefined,
          solutionLatex: answer.solution_latex || undefined
        }
      });

      const nextPublish = publishOnHighQuality
        ? vetted.qualityScore >= minQualityToPublish && vetted.reviewStatus === "auto_pass"
        : row.is_published;

      await supabaseRest(
        `question_bank?id=eq.${row.id}`,
        "PATCH",
        {
          stem_markdown: vetted.stemMarkdown,
          stem_latex: vetted.stemLatex,
          difficulty: vetted.difficulty,
          quality_score: vetted.qualityScore,
          review_status: vetted.reviewStatus,
          is_published: nextPublish,
          diagram_image_url: vetted.diagramImageUrl,
          diagram_caption: vetted.diagramCaption,
          ai_vetted_at: new Date().toISOString(),
          ai_vetting_score: vetted.qualityScore,
          ai_vetting_notes: vetted.issues.length > 0 ? vetted.issues.join(", ") : "passed",
          updated_at: new Date().toISOString()
        },
        "return=minimal"
      );

      if (row.question_type === "mcq_single" && vetted.options.length === 4) {
        await supabaseRest(`question_options?question_id=eq.${row.id}`, "DELETE");
        await supabaseRest(
          "question_options",
          "POST",
          vetted.options.map((opt) => ({
            question_id: row.id,
            option_key: opt.key,
            option_text_markdown: opt.text,
            option_latex: opt.latex || null
          })),
          "return=minimal"
        );
      }

      await supabaseRest(
        "question_answers",
        "POST",
        [
          {
            question_id: row.id,
            answer_type: vetted.answer.answerType,
            correct_option: vetted.answer.correctOption || null,
            correct_integer: vetted.answer.correctInteger ?? null,
            solution_markdown: vetted.answer.solutionMarkdown || null,
            solution_latex: vetted.answer.solutionLatex || null,
            updated_at: new Date().toISOString()
          }
        ],
        "resolution=merge-duplicates,return=minimal"
      );

      if (vetted.reviewStatus === "needs_review") {
        const existingOpenQueue = await supabaseRest<Array<{ id: string }>>(
          `question_review_queue?select=id&question_id=eq.${row.id}&status=eq.open&limit=1`,
          "GET"
        );
        if (existingOpenQueue.length === 0) {
          await supabaseRest(
            "question_review_queue",
            "POST",
            [
              {
                question_id: row.id,
                reason_codes: vetted.issues.length > 0 ? vetted.issues : ["needs_manual_review"],
                priority: vetted.qualityScore < 0.7 ? 3 : 5,
                status: "open",
                updated_at: new Date().toISOString()
              }
            ],
            "return=minimal"
          );
        }
      }

      if (nextPublish && !row.is_published) {
        published += 1;
      }
      updated += 1;
    }

    return NextResponse.json({ ok: true, processed: rows.length, updated, published });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Question vetting failed."
      },
      { status: 500 }
    );
  }
}

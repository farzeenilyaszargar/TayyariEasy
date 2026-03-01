import { NextRequest, NextResponse } from "next/server";
import { assertInternalIngestAuth } from "@/lib/server-auth";
import { supabaseRest } from "@/lib/supabase-server";

type IngestQuestion = {
  dedupeFingerprint: string;
  questionType: "mcq_single" | "integer";
  stemMarkdown: string;
  stemLatex?: string;
  subject: "Physics" | "Chemistry" | "Mathematics";
  topic: string;
  subtopic?: string;
  difficulty: "easy" | "medium" | "hard";
  sourceKind: "historical" | "hard_curated" | "ai_generated";
  examYear?: number;
  examPhase?: "Main" | "Advanced";
  marks?: number;
  negativeMarks?: number;
  qualityScore?: number;
  reviewStatus?: "auto_pass" | "needs_review" | "approved" | "rejected";
  publish?: boolean;
  options?: Array<{
    key: "A" | "B" | "C" | "D";
    text: string;
    latex?: string;
  }>;
  answer: {
    answerType: "option_key" | "integer_value";
    correctOption?: "A" | "B" | "C" | "D";
    correctInteger?: number;
    solutionMarkdown?: string;
    solutionLatex?: string;
  };
  provenance?: {
    sourceDocumentId?: string;
    sourceUrl: string;
    sourceQuestionRef?: string;
    extractionConfidence?: number;
  };
};

type BulkPayload = {
  questions?: IngestQuestion[];
};

export async function POST(request: NextRequest) {
  try {
    if (!assertInternalIngestAuth(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as BulkPayload;
    const questions = body.questions || [];

    if (questions.length === 0) {
      return NextResponse.json({ error: "questions[] is required." }, { status: 400 });
    }

    const insertedIds: string[] = [];

    for (const item of questions) {
      if (!item.dedupeFingerprint || !item.stemMarkdown || !item.topic) {
        continue;
      }

      const existing = await supabaseRest<Array<{ id: string }>>(
        `question_bank?select=id&dedupe_fingerprint=eq.${encodeURIComponent(item.dedupeFingerprint)}&limit=1`,
        "GET"
      );

      let questionId = existing[0]?.id;
      if (!questionId) {
        const created = await supabaseRest<Array<{ id: string }>>(
          "question_bank",
          "POST",
          [
            {
              question_type: item.questionType,
              stem_markdown: item.stemMarkdown,
              stem_latex: item.stemLatex || null,
              subject: item.subject,
              topic: item.topic,
              subtopic: item.subtopic || null,
              difficulty: item.difficulty,
              source_kind: item.sourceKind,
              exam_year: item.examYear || null,
              exam_phase: item.examPhase || null,
              marks: item.marks ?? 4,
              negative_marks: item.negativeMarks ?? 1,
              quality_score: item.qualityScore ?? 0,
              review_status: item.reviewStatus || "needs_review",
              is_published: Boolean(item.publish),
              dedupe_fingerprint: item.dedupeFingerprint,
              updated_at: new Date().toISOString()
            }
          ],
          "return=representation"
        );
        questionId = created[0]?.id;
      } else {
        await supabaseRest(
          `question_bank?id=eq.${questionId}`,
          "PATCH",
          {
            quality_score: item.qualityScore ?? 0,
            review_status: item.reviewStatus || "needs_review",
            is_published: Boolean(item.publish),
            updated_at: new Date().toISOString()
          },
          "return=minimal"
        );
      }

      if (!questionId) {
        continue;
      }

      insertedIds.push(questionId);

      if (item.questionType === "mcq_single" && item.options?.length) {
        await supabaseRest(`question_options?question_id=eq.${questionId}`, "DELETE");
        await supabaseRest(
          "question_options",
          "POST",
          item.options.map((option) => ({
            question_id: questionId,
            option_key: option.key,
            option_text_markdown: option.text,
            option_latex: option.latex || null
          })),
          "return=minimal"
        );
      }

      await supabaseRest(
        "question_answers",
        "POST",
        [
          {
            question_id: questionId,
            answer_type: item.answer.answerType,
            correct_option: item.answer.correctOption || null,
            correct_integer: item.answer.correctInteger ?? null,
            solution_markdown: item.answer.solutionMarkdown || null,
            solution_latex: item.answer.solutionLatex || null,
            updated_at: new Date().toISOString()
          }
        ],
        "resolution=merge-duplicates,return=minimal"
      );

      if (item.provenance?.sourceUrl) {
        await supabaseRest(
          "question_provenance",
          "POST",
          [
            {
              question_id: questionId,
              source_document_id: item.provenance.sourceDocumentId || null,
              source_question_ref: item.provenance.sourceQuestionRef || null,
              source_url: item.provenance.sourceUrl,
              extraction_confidence: item.provenance.extractionConfidence ?? 0
            }
          ],
          "return=minimal"
        );
      }

      const needsReview = (item.reviewStatus || "needs_review") === "needs_review";
      if (needsReview) {
        await supabaseRest(
          "question_review_queue",
          "POST",
          [
            {
              question_id: questionId,
              reason_codes: ["low_confidence"],
              priority: 5,
              status: "open",
              updated_at: new Date().toISOString()
            }
          ],
          "return=minimal"
        );
      }
    }

    return NextResponse.json({ ok: true, inserted: insertedIds.length, questionIds: insertedIds });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Bulk ingest failed."
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { vetQuestionWithAI } from "@/lib/question-vetting";
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
  useAiVetting?: boolean;
  publish?: boolean;
  diagramImageUrl?: string;
  diagramCaption?: string;
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

      const vetted = item.useAiVetting
        ? await vetQuestionWithAI({
            questionType: item.questionType,
            stemMarkdown: item.stemMarkdown,
            stemLatex: item.stemLatex || null,
            subject: item.subject,
            topic: item.topic,
            subtopic: item.subtopic || null,
            difficulty: item.difficulty,
            options: item.options || [],
            answer: item.answer,
            diagramImageUrl: item.diagramImageUrl || null,
            diagramCaption: item.diagramCaption || null
          })
        : null;

      const stemMarkdown = vetted?.stemMarkdown || item.stemMarkdown;
      const stemLatex = vetted?.stemLatex ?? item.stemLatex ?? null;
      const difficulty = vetted?.difficulty || item.difficulty;
      const options = vetted?.options || item.options || [];
      const answer = vetted?.answer || item.answer;
      const qualityScore = Number((vetted?.qualityScore ?? item.qualityScore ?? 0).toFixed(2));
      const aiIssues = vetted?.issues || [];
      const reviewStatus = item.reviewStatus || vetted?.reviewStatus || "needs_review";
      const publish = item.publish === true && (reviewStatus === "auto_pass" || reviewStatus === "approved");
      const diagramImageUrl = vetted?.diagramImageUrl ?? item.diagramImageUrl ?? null;
      const diagramCaption = vetted?.diagramCaption ?? item.diagramCaption ?? null;
      const aiVettedAt = item.useAiVetting ? new Date().toISOString() : null;

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
              stem_markdown: stemMarkdown,
              stem_latex: stemLatex,
              subject: item.subject,
              topic: item.topic,
              subtopic: item.subtopic || null,
              difficulty,
              source_kind: item.sourceKind,
              exam_year: item.examYear || null,
              exam_phase: item.examPhase || null,
              marks: item.marks ?? 4,
              negative_marks: item.negativeMarks ?? 1,
              quality_score: qualityScore,
              review_status: reviewStatus,
              is_published: publish,
              diagram_image_url: diagramImageUrl,
              diagram_caption: diagramCaption,
              ai_vetted_at: aiVettedAt,
              ai_vetting_score: item.useAiVetting ? qualityScore : null,
              ai_vetting_notes: item.useAiVetting ? (aiIssues.length > 0 ? aiIssues.join(", ") : "passed") : null,
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
            question_type: item.questionType,
            stem_markdown: stemMarkdown,
            stem_latex: stemLatex,
            subject: item.subject,
            topic: item.topic,
            subtopic: item.subtopic || null,
            difficulty,
            source_kind: item.sourceKind,
            exam_year: item.examYear || null,
            exam_phase: item.examPhase || null,
            marks: item.marks ?? 4,
            negative_marks: item.negativeMarks ?? 1,
            quality_score: qualityScore,
            review_status: reviewStatus,
            is_published: publish,
            diagram_image_url: diagramImageUrl,
            diagram_caption: diagramCaption,
            ai_vetted_at: aiVettedAt,
            ai_vetting_score: item.useAiVetting ? qualityScore : null,
            ai_vetting_notes: item.useAiVetting ? (aiIssues.length > 0 ? aiIssues.join(", ") : "passed") : null,
            updated_at: new Date().toISOString()
          },
          "return=minimal"
        );
      }

      if (!questionId) {
        continue;
      }

      insertedIds.push(questionId);

      if (item.questionType === "mcq_single" && options.length) {
        await supabaseRest(`question_options?question_id=eq.${questionId}`, "DELETE");
        await supabaseRest(
          "question_options",
          "POST",
          options.map((option) => ({
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
            answer_type: answer.answerType,
            correct_option: answer.correctOption || null,
            correct_integer: answer.correctInteger ?? null,
            solution_markdown: answer.solutionMarkdown || null,
            solution_latex: answer.solutionLatex || null,
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

      const needsReview = reviewStatus === "needs_review";
      if (needsReview) {
        const existingOpenQueue = await supabaseRest<Array<{ id: string }>>(
          `question_review_queue?select=id&question_id=eq.${questionId}&status=eq.open&limit=1`,
          "GET"
        );
        if (existingOpenQueue.length === 0) {
          await supabaseRest(
            "question_review_queue",
            "POST",
            [
              {
                question_id: questionId,
                reason_codes: aiIssues.length > 0 ? aiIssues : ["low_confidence"],
                priority: qualityScore < 0.7 ? 3 : 5,
                status: "open",
                updated_at: new Date().toISOString()
              }
            ],
            "return=minimal"
          );
        }
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

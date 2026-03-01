import { NextRequest, NextResponse } from "next/server";
import { fetchOptionsForQuestions } from "@/lib/test-engine";
import { supabaseRest } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const testInstanceId = new URL(request.url).searchParams.get("testInstanceId")?.trim();
    if (!testInstanceId) {
      return NextResponse.json({ error: "testInstanceId is required." }, { status: 400 });
    }

    const instanceRows = await supabaseRest<Array<{ id: string; blueprint_id: string }>>(
      `test_instances?select=id,blueprint_id&id=eq.${testInstanceId}&limit=1`,
      "GET"
    );

    const instance = instanceRows[0];
    if (!instance) {
      return NextResponse.json({ error: "Test instance not found." }, { status: 404 });
    }

    const blueprintRows = await supabaseRest<
      Array<{
        id: string;
        name: string;
        scope: "topic" | "subject" | "full_mock";
        subject: "Physics" | "Chemistry" | "Mathematics" | null;
        topic: string | null;
        duration_minutes: number;
        negative_marking: boolean;
      }>
    >(
      `test_blueprints?select=id,name,scope,subject,topic,duration_minutes,negative_marking&id=eq.${instance.blueprint_id}&limit=1`,
      "GET"
    );

    const blueprint = blueprintRows[0];
    if (!blueprint) {
      return NextResponse.json({ error: "Blueprint not found for test instance." }, { status: 404 });
    }

    const links = await supabaseRest<Array<{ question_id: string; position: number }>>(
      `test_instance_questions?select=question_id,position&test_instance_id=eq.${testInstanceId}&order=position.asc`,
      "GET"
    );

    if (links.length === 0) {
      return NextResponse.json({ error: "No questions found for this test instance." }, { status: 404 });
    }

    const inClause = links.map((row) => `"${row.question_id}"`).join(",");

    let questions: Array<{
      id: string;
      question_type: "mcq_single" | "integer";
      stem_markdown: string;
      stem_latex: string | null;
      diagram_image_url?: string | null;
      diagram_caption?: string | null;
      subject: "Physics" | "Chemistry" | "Mathematics";
      topic: string;
      difficulty: "easy" | "medium" | "hard";
      marks: number;
      negative_marks: number;
    }> = [];

    try {
      questions = await supabaseRest<
        Array<{
          id: string;
          question_type: "mcq_single" | "integer";
          stem_markdown: string;
          stem_latex: string | null;
          diagram_image_url: string | null;
          diagram_caption: string | null;
          subject: "Physics" | "Chemistry" | "Mathematics";
          topic: string;
          difficulty: "easy" | "medium" | "hard";
          marks: number;
          negative_marks: number;
        }>
      >(
        `question_bank?select=id,question_type,stem_markdown,stem_latex,diagram_image_url,diagram_caption,subject,topic,difficulty,marks,negative_marks&id=in.(${inClause})`,
        "GET"
      );
    } catch {
      questions = await supabaseRest<
        Array<{
          id: string;
          question_type: "mcq_single" | "integer";
          stem_markdown: string;
          stem_latex: string | null;
          subject: "Physics" | "Chemistry" | "Mathematics";
          topic: string;
          difficulty: "easy" | "medium" | "hard";
          marks: number;
          negative_marks: number;
        }>
      >(
        `question_bank?select=id,question_type,stem_markdown,stem_latex,subject,topic,difficulty,marks,negative_marks&id=in.(${inClause})`,
        "GET"
      );
    }

    const qMap = new Map(questions.map((q) => [q.id, q]));
    const orderedQuestions = links.map((link) => qMap.get(link.question_id)).filter(Boolean) as typeof questions;

    const options = await fetchOptionsForQuestions(orderedQuestions.map((q) => q.id));
    const optionsByQuestion = new Map<string, typeof options>();

    for (const option of options) {
      const list = optionsByQuestion.get(option.question_id) || [];
      list.push(option);
      optionsByQuestion.set(option.question_id, list);
    }

    return NextResponse.json({
      testInstanceId,
      blueprint: {
        id: blueprint.id,
        name: blueprint.name,
        scope: blueprint.scope,
        subject: blueprint.subject,
        topic: blueprint.topic,
        durationMinutes: blueprint.duration_minutes,
        negativeMarking: blueprint.negative_marking
      },
      questions: orderedQuestions.map((q, idx) => ({
        id: q.id,
        position: idx + 1,
        questionType: q.question_type,
        stemMarkdown: q.stem_markdown,
        stemLatex: q.stem_latex,
        diagramImageUrl: q.diagram_image_url || null,
        diagramCaption: q.diagram_caption || null,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        marks: q.marks,
        negativeMarks: q.negative_marks,
        options: (optionsByQuestion.get(q.id) || []).map((opt) => ({
          key: opt.option_key,
          text: opt.option_text_markdown,
          latex: opt.option_latex
        }))
      }))
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load test instance."
      },
      { status: 500 }
    );
  }
}

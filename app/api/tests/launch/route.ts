import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  ensureDefaultBlueprints,
  fetchOptionsForQuestions,
  fetchActiveBlueprints,
  pickQuestionsForBlueprint,
  type TestBlueprintRow
} from "@/lib/test-engine";
import { supabaseRest } from "@/lib/supabase-server";

type LaunchBody = {
  blueprintId?: string;
};

export async function POST(request: NextRequest) {
  try {
    await ensureDefaultBlueprints();

    const body = (await request.json()) as LaunchBody;
    const blueprintId = body.blueprintId?.trim();

    if (!blueprintId) {
      return NextResponse.json({ error: "blueprintId is required." }, { status: 400 });
    }

    const rows = await supabaseRest<Array<Omit<TestBlueprintRow, "distribution"> & { distribution: unknown }>>(
      `test_blueprints?select=id,name,scope,subject,topic,question_count,distribution,duration_minutes,negative_marking,is_active&id=eq.${blueprintId}&is_active=eq.true&limit=1`,
      "GET"
    );

    const blueprints = (await fetchActiveBlueprints()).filter((item) => item.id === blueprintId);
    const blueprint = blueprints[0];

    if (!rows[0] || !blueprint) {
      return NextResponse.json({ error: "Blueprint not found or inactive." }, { status: 404 });
    }

    let testInstance = (
      await supabaseRest<Array<{ id: string; seed: string | null }>>(
        `test_instances?select=id,seed&blueprint_id=eq.${blueprint.id}&order=published_at.desc&limit=1`,
        "GET"
      )
    )[0];

    let picked = [] as Array<{
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
    }>;

    if (testInstance) {
      const links = await supabaseRest<Array<{ question_id: string; position: number }>>(
        `test_instance_questions?select=question_id,position&test_instance_id=eq.${testInstance.id}&order=position.asc`,
        "GET"
      );

      if (links.length > 0) {
        const inClause = links.map((row) => `\"${row.question_id}\"`).join(",");
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
        picked = links.map((link) => qMap.get(link.question_id)).filter(Boolean) as typeof picked;
      }
    }

    if (picked.length === 0) {
      const seed = randomUUID();
      picked = await pickQuestionsForBlueprint(blueprint, seed);

      if (picked.length === 0) {
        return NextResponse.json({ error: "No published questions available for this blueprint." }, { status: 400 });
      }

      const createdInstances = await supabaseRest<Array<{ id: string; seed: string | null }>>(
        "test_instances",
        "POST",
        [
          {
            blueprint_id: blueprint.id,
            version: 1,
            seed,
            published_at: new Date().toISOString()
          }
        ],
        "return=representation"
      );

      testInstance = createdInstances[0];

      await supabaseRest(
        "test_instance_questions",
        "POST",
        picked.map((q, idx) => ({
          test_instance_id: testInstance.id,
          question_id: q.id,
          position: idx + 1
        })),
        "return=minimal"
      );
    }

    const options = await fetchOptionsForQuestions(picked.map((q) => q.id));
    const optionsByQuestion = new Map<string, typeof options>();

    for (const option of options) {
      const existing = optionsByQuestion.get(option.question_id) || [];
      existing.push(option);
      optionsByQuestion.set(option.question_id, existing);
    }

    return NextResponse.json({
      testInstanceId: testInstance.id,
      blueprint: {
        id: blueprint.id,
        name: blueprint.name,
        scope: blueprint.scope,
        subject: blueprint.subject,
        topic: blueprint.topic,
        durationMinutes: blueprint.duration_minutes,
        negativeMarking: blueprint.negative_marking
      },
      questions: picked.map((q, idx) => ({
        id: q.id,
        position: idx + 1,
        questionType: q.question_type,
        stemMarkdown: q.stem_markdown,
        stemLatex: q.stem_latex,
        diagramImageUrl: q.diagram_image_url,
        diagramCaption: q.diagram_caption,
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
        error: error instanceof Error ? error.message : "Failed to launch test."
      },
      { status: 500 }
    );
  }
}

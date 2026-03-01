import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { fetchOptionsForQuestions, fetchActiveBlueprints, pickQuestionsForBlueprint, type TestBlueprintRow } from "@/lib/test-engine";
import { supabaseRest } from "@/lib/supabase-server";

type LaunchBody = {
  blueprintId?: string;
};

export async function POST(request: NextRequest) {
  try {
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

    const seed = randomUUID();
    const picked = await pickQuestionsForBlueprint(blueprint, seed);

    if (picked.length === 0) {
      return NextResponse.json({ error: "No published questions available for this blueprint." }, { status: 400 });
    }

    const createdInstances = await supabaseRest<Array<{ id: string; published_at: string }>>(
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

    const testInstance = createdInstances[0];

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

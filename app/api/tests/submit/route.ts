import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server-auth";
import { fetchAnswersForQuestions } from "@/lib/test-engine";
import { supabaseRest } from "@/lib/supabase-server";

type SubmitBody = {
  testInstanceId?: string;
  answers?: Record<string, string | number>;
  timeTakenSeconds?: number;
};

type QuestionMeta = {
  id: string;
  subject: "Physics" | "Chemistry" | "Mathematics";
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  negative_marks: number;
};

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const isGuestAttempt = !user?.id;

    const body = (await request.json()) as SubmitBody;
    const testInstanceId = body.testInstanceId?.trim();
    const answers = body.answers || {};

    if (!testInstanceId) {
      return NextResponse.json({ error: "testInstanceId is required." }, { status: 400 });
    }

    const links = await supabaseRest<Array<{ question_id: string; position: number }>>(
      `test_instance_questions?select=question_id,position&test_instance_id=eq.${testInstanceId}&order=position.asc`,
      "GET"
    );

    if (links.length === 0) {
      return NextResponse.json({ error: "Test instance not found." }, { status: 404 });
    }

    const questionIds = links.map((item) => item.question_id);
    const inClause = questionIds.map((id) => `"${id}"`).join(",");

    const metas = await supabaseRest<QuestionMeta[]>(
      `question_bank?select=id,subject,topic,difficulty,marks,negative_marks&id=in.(${inClause})`,
      "GET"
    );

    const answersKey = await fetchAnswersForQuestions(questionIds);
    const answerMap = new Map(answersKey.map((item) => [item.question_id, item]));
    const metaMap = new Map(metas.map((item) => [item.id, item]));

    let totalScore = 0;
    let correctCount = 0;
    let attemptedCount = 0;

    const topicStats = new Map<string, { correct: number; attempted: number }>();
    const difficultyStats = new Map<string, { correct: number; attempted: number }>();

    for (const qid of questionIds) {
      const expected = answerMap.get(qid);
      const meta = metaMap.get(qid);
      if (!expected || !meta) {
        continue;
      }

      const submitted = answers[qid];
      if (submitted === undefined || submitted === null || String(submitted).trim() === "") {
        continue;
      }

      attemptedCount += 1;
      const topicBucket = topicStats.get(meta.topic) || { correct: 0, attempted: 0 };
      const diffBucket = difficultyStats.get(meta.difficulty) || { correct: 0, attempted: 0 };
      topicBucket.attempted += 1;
      diffBucket.attempted += 1;

      let isCorrect = false;
      if (expected.answer_type === "option_key") {
        isCorrect = String(submitted).toUpperCase() === String(expected.correct_option || "").toUpperCase();
      } else if (expected.answer_type === "integer_value") {
        const userInt = Number(submitted);
        const correctInt = Number(expected.correct_integer);
        isCorrect = Number.isFinite(userInt) && Number.isFinite(correctInt) && userInt === correctInt;
      }

      if (isCorrect) {
        totalScore += meta.marks;
        correctCount += 1;
        topicBucket.correct += 1;
        diffBucket.correct += 1;
      } else {
        totalScore -= meta.negative_marks;
      }

      topicStats.set(meta.topic, topicBucket);
      difficultyStats.set(meta.difficulty, diffBucket);
    }

    const maxScore = metas.reduce((sum, q) => sum + q.marks, 0);
    const percentile = maxScore > 0 ? Math.max(0, Math.min(99.99, (Math.max(0, totalScore) / maxScore) * 100)) : 0;
    const completionBonus = 20;
    const accuracyBonus = Math.max(0, Math.round((correctCount / Math.max(1, questionIds.length)) * 30));
    const earnedPoints = Math.max(0, Math.round(totalScore)) + completionBonus + accuracyBonus;

    const instanceRows = await supabaseRest<Array<{ blueprint_id: string }>>(
      `test_instances?select=blueprint_id&id=eq.${testInstanceId}&limit=1`,
      "GET"
    );
    const blueprintRows = instanceRows[0]
      ? await supabaseRest<Array<{ name: string }>>(
          `test_blueprints?select=name&id=eq.${instanceRows[0].blueprint_id}&limit=1`,
          "GET"
        )
      : [];

    if (!isGuestAttempt && user?.id) {
      await supabaseRest(
        "test_attempts",
        "POST",
        [
          {
            user_id: user.id,
            test_name: blueprintRows[0]?.name || "Generated Test",
            score: Number(totalScore.toFixed(2)),
            percentile: Number(percentile.toFixed(2)),
            attempted_at: new Date().toISOString().slice(0, 10)
          }
        ],
        "return=minimal"
      );
    }

    return NextResponse.json({
      testInstanceId,
      score: Number(totalScore.toFixed(2)),
      maxScore,
      completionBonus,
      accuracyBonus,
      earnedPoints,
      percentile: Number(percentile.toFixed(2)),
      correctCount,
      attemptedCount,
      totalQuestions: questionIds.length,
      topicBreakdown: Array.from(topicStats.entries()).map(([topic, val]) => ({
        topic,
        attempted: val.attempted,
        correct: val.correct,
        accuracy: val.attempted > 0 ? Number(((val.correct / val.attempted) * 100).toFixed(2)) : 0
      })),
      difficultyBreakdown: Array.from(difficultyStats.entries()).map(([difficulty, val]) => ({
        difficulty,
        attempted: val.attempted,
        correct: val.correct,
        accuracy: val.attempted > 0 ? Number(((val.correct / val.attempted) * 100).toFixed(2)) : 0
      })),
      timeTakenSeconds: body.timeTakenSeconds || null,
      savedToCloud: !isGuestAttempt
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to submit test."
      },
      { status: 500 }
    );
  }
}

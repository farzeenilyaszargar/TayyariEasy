import { NextRequest, NextResponse } from "next/server";
import { deepseekChat, hasDeepSeekConfig } from "@/lib/deepseek";

type DashboardInput = {
  rankRange: string;
  scoreRange: string;
  confidence: string;
  points: number;
  streak: number;
  testsCompleted: number;
  recentScores: number[];
  insights: string[];
};

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as DashboardInput;

    if (!hasDeepSeekConfig()) {
      return NextResponse.json(
        { error: "DeepSeek API key missing. Add DEEPSEEK_API_KEY in .env.local." },
        { status: 500 }
      );
    }

    const userPrompt = [
      `Rank Range: ${payload.rankRange}`,
      `Score Range: ${payload.scoreRange}`,
      `Confidence: ${payload.confidence}`,
      `Points: ${payload.points}`,
      `Streak (days): ${payload.streak}`,
      `Tests Completed: ${payload.testsCompleted}`,
      `Recent Scores: ${payload.recentScores.join(", ") || "none"}`,
      `AI Insights: ${payload.insights.join(" | ") || "none"}`
    ].join("\n");

    const analysis = await deepseekChat({
      messages: [
        {
          role: "system",
          content:
            "You are an expert JEE preparation mentor. Analyze dashboard data and return concise actionable guidance in markdown with these sections only: 1) Current Performance, 2) Key Gaps, 3) 7-Day Action Plan."
        },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2,
      maxTokens: 700
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate dashboard analysis.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
  includeAnalysis?: boolean;
};

type ForecastPayload = {
  estimatedScore: number;
  estimatedScoreLow: number;
  estimatedScoreHigh: number;
  estimatedRank: number;
  estimatedRankLow: number;
  estimatedRankHigh: number;
  confidence: string;
  method: string;
  riskNotes: string[];
  calculatedFrom: string;
};

const MAX_JEE_PARTICIPANTS = 1_200_000;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdDev(values: number[]) {
  if (values.length <= 1) {
    return 0;
  }
  const avg = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function interpolateRank(score: number) {
  const points: Array<{ score: number; rank: number }> = [
    { score: 300, rank: 200 },
    { score: 280, rank: 700 },
    { score: 260, rank: 1700 },
    { score: 240, rank: 3500 },
    { score: 220, rank: 7000 },
    { score: 200, rank: 14000 },
    { score: 180, rank: 28000 },
    { score: 160, rank: 52000 },
    { score: 140, rank: 90000 },
    { score: 120, rank: 145000 },
    { score: 100, rank: 220000 },
    { score: 80, rank: 320000 },
    { score: 60, rank: 510000 },
    { score: 40, rank: 720000 },
    { score: 20, rank: 950000 },
    { score: 0, rank: 1120000 }
  ];

  const s = clamp(score, 0, 300);
  for (let i = 0; i < points.length - 1; i += 1) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (s <= p1.score && s >= p2.score) {
      const t = (s - p2.score) / Math.max(1, p1.score - p2.score);
      return Math.round(p2.rank + t * (p1.rank - p2.rank));
    }
  }
  return 1120000;
}

function parseRiskJson(raw: string) {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function buildForecast(payload: DashboardInput): Promise<ForecastPayload> {
  const scores = payload.recentScores.filter((n) => Number.isFinite(n)).slice(-12);
  if (scores.length === 0) {
    return {
      estimatedScore: 0,
      estimatedScoreLow: 0,
      estimatedScoreHigh: 0,
      estimatedRank: 0,
      estimatedRankLow: 0,
      estimatedRankHigh: 0,
      confidence: "Not enough attempts",
      method: "Realistic score/rank forecast pending data",
      riskNotes: ["Take at least 3 full tests for a reliable score/rank range."],
      calculatedFrom: "0 attempts"
    };
  }

  const recent = scores.slice(-6);
  const avg = mean(scores);
  const prevRecent = scores.slice(Math.max(0, scores.length - 10), Math.max(0, scores.length - 5));
  const recentAvg = mean(recent);
  const prevRecentAvg = prevRecent.length > 0 ? mean(prevRecent) : recentAvg;
  const recencyMomentum = recentAvg - prevRecentAvg;

  // Weighted estimate with stronger emphasis on recent attempts.
  let weightedSum = 0;
  let weightSum = 0;
  for (let i = scores.length - 1, age = 0; i >= 0; i -= 1, age += 1) {
    const w = Math.pow(0.85, age);
    weightedSum += scores[i] * w;
    weightSum += w;
  }
  const recencyWeighted = weightSum > 0 ? weightedSum / weightSum : recentAvg;

  const volatility = stdDev(scores);
  const baseScore = recentAvg * 0.5 + recencyWeighted * 0.3 + avg * 0.2 + recencyMomentum * 0.25;
  const samplePenalty = scores.length < 4 ? (4 - scores.length) * 1.5 : 0;

  let estimatedScore = clamp(
    Math.round(baseScore - samplePenalty),
    0,
    300
  );

  let aiUncertaintyBoost = 0;
  let aiRankShiftPct = 0;
  let riskNotes: string[] = [];
  let uncertaintyScore = clamp(8 + volatility * 0.5 + (scores.length < 6 ? (6 - scores.length) * 1.2 : 0), 6, 30);

  if (hasDeepSeekConfig()) {
    const riskPrompt = [
      "Return strict JSON only.",
      "You are calibrating a realistic JEE forecast using test history. Avoid both optimistic and pessimistic extremes.",
      `Recent scores: ${scores.join(", ")}`,
      `Recency weighted mean: ${recencyWeighted.toFixed(2)}`,
      `Recent momentum: ${recencyMomentum.toFixed(2)}`,
      `Overall average: ${avg.toFixed(2)}`,
      `Volatility: ${volatility.toFixed(2)}`,
      `Current confidence label: ${payload.confidence}`,
      `Tests completed: ${payload.testsCompleted}, streak: ${payload.streak}, points: ${payload.points}`,
      "JSON schema:",
      '{"uncertainty_boost_score": number (0..6), "rank_shift_percent": number (-0.04..0.06), "confidence_label": string, "risk_notes": string[]}'
    ].join("\n");

    try {
      const riskRaw = await deepseekChat({
        messages: [
          {
            role: "system",
            content:
              "You are a fair exam forecaster. Keep output realistic and data-grounded. Return strict JSON only."
          },
          { role: "user", content: riskPrompt }
        ],
        temperature: 0.1,
        maxTokens: 450
      });

      const parsed = parseRiskJson(riskRaw);
      if (parsed) {
        aiUncertaintyBoost = clamp(Number(parsed.uncertainty_boost_score || 0), 0, 6);
        aiRankShiftPct = clamp(Number(parsed.rank_shift_percent || 0), -0.04, 0.06);
        riskNotes = Array.isArray(parsed.risk_notes) ? parsed.risk_notes.map((x) => String(x)) : [];
      }
    } catch {
      // fallback to deterministic penalties only
    }
  }

  uncertaintyScore = clamp(uncertaintyScore + aiUncertaintyBoost, 6, 35);
  const estimatedScoreLow = clamp(Math.round(estimatedScore - uncertaintyScore), 0, 300);
  const estimatedScoreHigh = clamp(Math.round(estimatedScore + uncertaintyScore * 0.9), 0, 300);

  const baseRank = interpolateRank(estimatedScore);
  let estimatedRank = clamp(Math.round(baseRank * (1 + aiRankShiftPct)), 1, MAX_JEE_PARTICIPANTS);
  const sampleGap = scores.length < 8 ? 8 - scores.length : 0;
  const rankHalfBand = clamp(
    Math.round(
      1500 + volatility * 120 + sampleGap * 700 + Math.min(7000, estimatedRank * 0.012)
    ),
    1500,
    12000
  );
  const estimatedRankLow = clamp(estimatedRank - rankHalfBand, 1, MAX_JEE_PARTICIPANTS);
  const estimatedRankHigh = clamp(estimatedRank + rankHalfBand, 1, MAX_JEE_PARTICIPANTS);

  const confidence =
    scores.length >= 10 && volatility < 14
      ? "High"
      : scores.length >= 6
      ? "Moderate"
      : "Low-Moderate";

  return {
    estimatedScore,
    estimatedScoreLow,
    estimatedScoreHigh,
    estimatedRank,
    estimatedRankLow,
    estimatedRankHigh,
    confidence,
    method: "Recent-average + recency weighting + stability bands",
    riskNotes:
      riskNotes.length > 0
        ? riskNotes
        : [
            "Range expands when score consistency is low or attempt count is small.",
            "Recent attempts are weighted more than older attempts."
          ],
    calculatedFrom: `${scores.length} attempts | recent avg ${recentAvg.toFixed(1)} | overall avg ${avg.toFixed(1)} | std dev ${volatility.toFixed(1)}`
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as DashboardInput;
    const includeAnalysis = payload.includeAnalysis !== false;

    if (!hasDeepSeekConfig()) {
      return NextResponse.json(
        { error: "DeepSeek API key missing. Add DEEPSEEK_API_KEY in .env.local." },
        { status: 500 }
      );
    }

    const forecast = await buildForecast(payload);

    if (!includeAnalysis) {
      return NextResponse.json({ forecast });
    }

    const userPrompt = [
      `Raw Rank Range (DB): ${payload.rankRange}`,
      `Raw Score Range (DB): ${payload.scoreRange}`,
      `Raw Confidence: ${payload.confidence}`,
      `AI Rank Estimate: ${forecast.estimatedRank}`,
      `AI Rank Range: ${forecast.estimatedRankLow} - ${forecast.estimatedRankHigh}`,
      `AI Score Estimate: ${forecast.estimatedScore}`,
      `AI Score Range: ${forecast.estimatedScoreLow} - ${forecast.estimatedScoreHigh}`,
      `Confidence: ${forecast.confidence}`,
      `Forecast Method: ${forecast.method}`,
      `Forecast Basis: ${forecast.calculatedFrom}`,
      `Risk Notes: ${forecast.riskNotes.join(" | ")}`,
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
            "You are an expert JEE preparation mentor. Analyze dashboard data using realistic assumptions and return concise actionable guidance in markdown with these sections only: 1) Current Performance, 2) Key Gaps, 3) 7-Day Action Plan."
        },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2,
      maxTokens: 700
    });

    return NextResponse.json({ analysis, forecast });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate dashboard analysis.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

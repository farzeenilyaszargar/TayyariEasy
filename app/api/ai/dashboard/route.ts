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
  estimatedRank: number;
  confidence: string;
  method: string;
  riskNotes: string[];
  calculatedFrom: string;
};

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

function median(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
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
    { score: 60, rank: 450000 },
    { score: 0, rank: 650000 }
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
  return 650000;
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

async function buildConservativeForecast(payload: DashboardInput): Promise<ForecastPayload> {
  const scores = payload.recentScores.filter((n) => Number.isFinite(n)).slice(-12);
  if (scores.length === 0) {
    return {
      estimatedScore: 0,
      estimatedRank: 0,
      confidence: "Not enough attempts",
      method: "Recency-weighted AI estimate pending data",
      riskNotes: ["Take at least 3 full tests for conservative AIR/score forecasting."],
      calculatedFrom: "0 attempts"
    };
  }

  const recent = scores.slice(-6);
  const avg = mean(scores);
  const last = scores[scores.length - 1];
  const prevRecent = scores.slice(Math.max(0, scores.length - 10), Math.max(0, scores.length - 5));
  const recentAvg = mean(recent);
  const prevRecentAvg = prevRecent.length > 0 ? mean(prevRecent) : recentAvg;
  const recencyMomentum = recentAvg - prevRecentAvg;
  const improvementSlope = (scores[scores.length - 1] - scores[0]) / Math.max(1, scores.length - 1);

  // Weighted moving estimate with explicit recency emphasis.
  let weightedSum = 0;
  let weightSum = 0;
  for (let i = scores.length - 1, age = 0; i >= 0; i -= 1, age += 1) {
    const w = Math.pow(0.82, age);
    weightedSum += scores[i] * w;
    weightSum += w;
  }
  const recencyWeighted = weightSum > 0 ? weightedSum / weightSum : recentAvg;

  const volatility = stdDev(scores);
  const volatilityPenalty = Math.min(14, volatility * 0.55);
  const samplePenalty = scores.length < 5 ? (5 - scores.length) * 2.5 : 0;
  const mildConservativeBias = 4;

  let estimatedScore = clamp(
    Math.round(recencyWeighted + recencyMomentum * 0.45 + improvementSlope * 1.15 - volatilityPenalty - samplePenalty - mildConservativeBias),
    0,
    300
  );

  let aiPenaltyScore = 0;
  let aiPenaltyRankPct = 0;
  let riskNotes: string[] = [];

  if (hasDeepSeekConfig()) {
    const riskPrompt = [
      "Return strict JSON only.",
      "You are calibrating a conservative JEE forecast. Be mildly pessimistic, not extreme.",
      `Recent scores: ${scores.join(", ")}`,
      `Recency weighted mean: ${recencyWeighted.toFixed(2)}`,
      `Recent momentum: ${recencyMomentum.toFixed(2)}`,
      `Improvement slope: ${improvementSlope.toFixed(2)}`,
      `Volatility: ${volatility.toFixed(2)}`,
      `Current confidence label: ${payload.confidence}`,
      `Tests completed: ${payload.testsCompleted}, streak: ${payload.streak}, points: ${payload.points}`,
      "JSON schema:",
      '{"risk_penalty_score": number (0..10), "risk_penalty_rank_percent": number (0..0.2), "confidence_label": string, "risk_notes": string[]}'
    ].join("\n");

    try {
      const riskRaw = await deepseekChat({
        messages: [
          {
            role: "system",
            content: "You are a strict exam forecaster. Never be optimistic. Return strict JSON only."
          },
          { role: "user", content: riskPrompt }
        ],
        temperature: 0.1,
        maxTokens: 450
      });

      const parsed = parseRiskJson(riskRaw);
      if (parsed) {
        aiPenaltyScore = clamp(Number(parsed.risk_penalty_score || 0), 0, 10);
        aiPenaltyRankPct = clamp(Number(parsed.risk_penalty_rank_percent || 0), 0, 0.2);
        riskNotes = Array.isArray(parsed.risk_notes) ? parsed.risk_notes.map((x) => String(x)) : [];
      }
    } catch {
      // fallback to deterministic penalties only
    }
  }

  estimatedScore = clamp(Math.round(estimatedScore - aiPenaltyScore), 0, 300);
  const baseRank = interpolateRank(estimatedScore);
  const volatilityRankPenalty = Math.round(volatility * 650);
  const sampleRankPenalty = scores.length < 5 ? (5 - scores.length) * 5500 : 0;
  const estimatedRank = clamp(
    Math.round(baseRank * (1 + aiPenaltyRankPct) + volatilityRankPenalty + sampleRankPenalty),
    1,
    800000
  );

  const confidence =
    scores.length >= 8 && volatility < 16
      ? "Moderate"
      : scores.length >= 5
        ? "Low-Moderate"
        : "Low";

  return {
    estimatedScore,
    estimatedRank,
    confidence,
    method: "Recency-weighted estimate + momentum + volatility/risk adjustments",
    riskNotes:
      riskNotes.length > 0
        ? riskNotes
        : [
            "Estimate includes conservative risk adjustment for volatility and limited sample size.",
            "Recent activity is weighted more than older attempts."
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

    const forecast = await buildConservativeForecast(payload);

    if (!includeAnalysis) {
      return NextResponse.json({ forecast });
    }

    const userPrompt = [
      `Raw Rank Range (DB): ${payload.rankRange}`,
      `Raw Score Range (DB): ${payload.scoreRange}`,
      `Raw Confidence: ${payload.confidence}`,
      `Conservative AI Rank Estimate: ${forecast.estimatedRank}`,
      `Conservative AI Score Estimate: ${forecast.estimatedScore}`,
      `Conservative Confidence: ${forecast.confidence}`,
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
            "You are an expert JEE preparation mentor. Analyze dashboard data using conservative assumptions and return concise actionable guidance in markdown with these sections only: 1) Current Performance, 2) Key Gaps, 3) 7-Day Action Plan."
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

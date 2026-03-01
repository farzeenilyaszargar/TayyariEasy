import "server-only";

import { deepseekChat, hasDeepSeekConfig } from "@/lib/deepseek";

type QuestionType = "mcq_single" | "integer";
type Difficulty = "easy" | "medium" | "hard";
type Subject = "Physics" | "Chemistry" | "Mathematics";

type IncomingOption = {
  key: "A" | "B" | "C" | "D";
  text: string;
  latex?: string | null;
};

type IncomingAnswer = {
  answerType: "option_key" | "integer_value";
  correctOption?: "A" | "B" | "C" | "D";
  correctInteger?: number;
  solutionMarkdown?: string;
  solutionLatex?: string;
};

type VettableQuestion = {
  questionType: QuestionType;
  stemMarkdown: string;
  stemLatex?: string | null;
  subject: Subject;
  topic: string;
  subtopic?: string | null;
  difficulty: Difficulty;
  options?: IncomingOption[];
  answer: IncomingAnswer;
  diagramImageUrl?: string | null;
  diagramCaption?: string | null;
};

export type VettedQuestion = {
  questionType: QuestionType;
  stemMarkdown: string;
  stemLatex: string | null;
  subject: Subject;
  topic: string;
  subtopic: string | null;
  difficulty: Difficulty;
  options: IncomingOption[];
  answer: IncomingAnswer;
  diagramImageUrl: string | null;
  diagramCaption: string | null;
  qualityScore: number;
  reviewStatus: "auto_pass" | "needs_review";
  issues: string[];
};

function clampScore(value: unknown, fallback = 0.72) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return fallback;
  }
  return Math.max(0, Math.min(0.99, Number(num.toFixed(2))));
}

function normalizeOptionKeys(options: IncomingOption[]) {
  const orderedKeys: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];
  const map = new Map(options.map((opt) => [String(opt.key).toUpperCase(), opt]));
  return orderedKeys
    .map((key) => {
      const src = map.get(key);
      if (!src) {
        return null;
      }
      return {
        key,
        text: String(src.text || "").trim(),
        latex: src.latex ? String(src.latex) : null
      };
    })
    .filter(Boolean) as IncomingOption[];
}

function cleanStem(text: string) {
  return String(text || "")
    .replace(/\s+$/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sanitizeFallback(input: VettableQuestion): VettedQuestion {
  const options = input.questionType === "mcq_single" ? normalizeOptionKeys(input.options || []) : [];
  const issues: string[] = [];

  if (input.questionType === "mcq_single" && options.length !== 4) {
    issues.push("mcq_option_count_invalid");
  }

  if (input.answer.answerType === "option_key") {
    const key = String(input.answer.correctOption || "").toUpperCase() as "A" | "B" | "C" | "D";
    if (!["A", "B", "C", "D"].includes(key)) {
      issues.push("missing_correct_option");
    }
  }

  if (input.answer.answerType === "integer_value" && !Number.isFinite(Number(input.answer.correctInteger))) {
    issues.push("missing_integer_answer");
  }

  const qualityScore = issues.length === 0 ? 0.84 : 0.63;

  return {
    questionType: input.questionType,
    stemMarkdown: cleanStem(input.stemMarkdown),
    stemLatex: input.stemLatex ? String(input.stemLatex).trim() : null,
    subject: input.subject,
    topic: String(input.topic || "").trim(),
    subtopic: input.subtopic ? String(input.subtopic).trim() : null,
    difficulty: input.difficulty,
    options,
    answer: {
      answerType: input.answer.answerType,
      correctOption: input.answer.correctOption,
      correctInteger: input.answer.correctInteger,
      solutionMarkdown: input.answer.solutionMarkdown ? cleanStem(input.answer.solutionMarkdown) : undefined,
      solutionLatex: input.answer.solutionLatex ? String(input.answer.solutionLatex).trim() : undefined
    },
    diagramImageUrl: input.diagramImageUrl ? String(input.diagramImageUrl).trim() : null,
    diagramCaption: input.diagramCaption ? String(input.diagramCaption).trim() : null,
    qualityScore,
    reviewStatus: qualityScore >= 0.8 ? "auto_pass" : "needs_review",
    issues
  };
}

function extractJson(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const direct = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(direct) as Record<string, unknown>;
  } catch {
    // continue
  }

  const first = direct.indexOf("{");
  const last = direct.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try {
      return JSON.parse(direct.slice(first, last + 1)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  return null;
}

export async function vetQuestionWithAI(input: VettableQuestion): Promise<VettedQuestion> {
  const fallback = sanitizeFallback(input);
  if (!hasDeepSeekConfig()) {
    return fallback;
  }

  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  const prompt = [
    "Validate and repair this JEE question.",
    "Return STRICT JSON object only.",
    "Keep academic correctness. Fix formatting (markdown/latex) and option text issues.",
    "Schema:",
    "{",
    '  "stemMarkdown": string,',
    '  "stemLatex": string|null,',
    '  "difficulty": "easy"|"medium"|"hard",',
    '  "options": [{"key":"A"|"B"|"C"|"D","text":string,"latex":string|null}] (for mcq else []),',
    '  "answer": {"answerType":"option_key"|"integer_value","correctOption":"A"|"B"|"C"|"D"|null,"correctInteger":number|null,"solutionMarkdown":string|null,"solutionLatex":string|null},',
    '  "diagramImageUrl": string|null,',
    '  "diagramCaption": string|null,',
    '  "qualityScore": number (0 to 0.99),',
    '  "issues": string[]',
    "}",
    "If you are uncertain about correctness, lower qualityScore and add issue code uncertain_correctness.",
    `Input question JSON:\n${JSON.stringify(input)}`
  ].join("\n");

  try {
    const raw = await deepseekChat({
      messages: [
        {
          role: "system",
          content:
            `You are an expert JEE question quality reviewer using model ${model}. Return strict JSON only. Do not use markdown fences.`
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      maxTokens: 2200
    });

    const parsed = extractJson(raw);
    if (!parsed) {
      return fallback;
    }

    const optionsRaw = Array.isArray(parsed.options) ? (parsed.options as IncomingOption[]) : [];
    const options = input.questionType === "mcq_single" ? normalizeOptionKeys(optionsRaw) : [];
    const qualityScore = clampScore(parsed.qualityScore, fallback.qualityScore);
    const issues = Array.isArray(parsed.issues) ? parsed.issues.map((x) => String(x)) : [];

    const answerRaw = (parsed.answer || {}) as Record<string, unknown>;
    const answer: IncomingAnswer = {
      answerType: answerRaw.answerType === "integer_value" ? "integer_value" : "option_key",
      correctOption: answerRaw.correctOption ? String(answerRaw.correctOption).toUpperCase() as "A" | "B" | "C" | "D" : undefined,
      correctInteger:
        answerRaw.correctInteger === null || answerRaw.correctInteger === undefined
          ? undefined
          : Number(answerRaw.correctInteger),
      solutionMarkdown: answerRaw.solutionMarkdown ? cleanStem(String(answerRaw.solutionMarkdown)) : undefined,
      solutionLatex: answerRaw.solutionLatex ? String(answerRaw.solutionLatex).trim() : undefined
    };

    const vetted: VettedQuestion = {
      questionType: input.questionType,
      stemMarkdown: cleanStem(String(parsed.stemMarkdown || fallback.stemMarkdown)),
      stemLatex: parsed.stemLatex ? String(parsed.stemLatex).trim() : null,
      subject: input.subject,
      topic: String(input.topic || "").trim(),
      subtopic: input.subtopic ? String(input.subtopic).trim() : null,
      difficulty:
        parsed.difficulty === "easy" || parsed.difficulty === "medium" || parsed.difficulty === "hard"
          ? parsed.difficulty
          : fallback.difficulty,
      options,
      answer,
      diagramImageUrl: parsed.diagramImageUrl ? String(parsed.diagramImageUrl).trim() : fallback.diagramImageUrl,
      diagramCaption: parsed.diagramCaption ? String(parsed.diagramCaption).trim() : fallback.diagramCaption,
      qualityScore,
      reviewStatus: qualityScore >= 0.85 && issues.length === 0 ? "auto_pass" : "needs_review",
      issues
    };

    if (vetted.questionType === "mcq_single" && vetted.options.length !== 4) {
      return {
        ...fallback,
        qualityScore: Math.min(fallback.qualityScore, 0.65),
        reviewStatus: "needs_review",
        issues: Array.from(new Set([...fallback.issues, "mcq_option_count_invalid"]))
      };
    }

    if (vetted.answer.answerType === "option_key") {
      const valid = ["A", "B", "C", "D"].includes(String(vetted.answer.correctOption || ""));
      if (!valid) {
        return {
          ...fallback,
          qualityScore: Math.min(fallback.qualityScore, 0.62),
          reviewStatus: "needs_review",
          issues: Array.from(new Set([...fallback.issues, "missing_correct_option"]))
        };
      }
    }

    if (vetted.answer.answerType === "integer_value" && !Number.isFinite(Number(vetted.answer.correctInteger))) {
      return {
        ...fallback,
        qualityScore: Math.min(fallback.qualityScore, 0.62),
        reviewStatus: "needs_review",
        issues: Array.from(new Set([...fallback.issues, "missing_integer_answer"]))
      };
    }

    return vetted;
  } catch {
    return fallback;
  }
}

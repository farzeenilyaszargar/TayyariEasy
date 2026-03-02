import "server-only";

import { deepseekChat, hasDeepSeekConfig } from "@/lib/deepseek";

type QuestionType = "mcq_single" | "integer";
type Difficulty = "easy" | "medium" | "hard";
type Subject = "Physics" | "Chemistry" | "Mathematics";
type ExamFit = "Main" | "Advanced" | "Not_JEE";
type GradeBand = "class_11_12" | "below_11" | "outside_jee" | "unknown";

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
  examFit: ExamFit;
  gradeBand: GradeBand;
  diagramRequired: boolean;
};

const STRICT_AUTO_PASS_MIN_SCORE = 0.93;

const STRICT_HARD_REJECT_ISSUES = new Set([
  "not_jee_relevant",
  "below_class_11",
  "outside_jee_syllabus",
  "concept_error",
  "ambiguous_prompt",
  "multiple_correct_options",
  "missing_correct_option",
  "missing_integer_answer",
  "insufficient_data",
  "non_deterministic_answer",
  "invalid_question_type",
  "invalid_options"
]);

function clampScore(value: unknown, fallback = 0.72) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return fallback;
  }
  return Math.max(0, Math.min(0.99, Number(num.toFixed(2))));
}

function normalizeIssueCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function uniqueIssues(values: string[]) {
  const normalized = values.map(normalizeIssueCode).filter(Boolean);
  return Array.from(new Set(normalized));
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

function detectDiagramRequirement(text: string) {
  const normalized = text.toLowerCase();
  return /(\bfigure\b|\bdiagram\b|\bgraph\b|\bcircuit\b|\bfree body\b|\bline shown\b|\bplot\b)/.test(normalized);
}

function parseGradeBand(value: unknown, fallback: GradeBand = "unknown"): GradeBand {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "class_11_12" || normalized === "class11_12" || normalized === "11_12") {
    return "class_11_12";
  }
  if (normalized === "below_11" || normalized === "below_class_11") {
    return "below_11";
  }
  if (normalized === "outside_jee" || normalized === "outside_syllabus" || normalized === "outside_jee_syllabus") {
    return "outside_jee";
  }
  return fallback;
}

function parseExamFit(value: unknown, fallback: ExamFit = "Main"): ExamFit {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "advanced") {
    return "Advanced";
  }
  if (normalized === "main") {
    return "Main";
  }
  if (normalized === "not_jee" || normalized === "notjee" || normalized === "not_fit") {
    return "Not_JEE";
  }
  return fallback;
}

function applyStrictRules(vetted: VettedQuestion): VettedQuestion {
  const issues = uniqueIssues(vetted.issues);
  const issueSet = new Set(issues);

  if (vetted.gradeBand === "below_11") {
    issueSet.add("below_class_11");
  }
  if (vetted.gradeBand === "outside_jee") {
    issueSet.add("outside_jee_syllabus");
  }
  if (vetted.gradeBand === "unknown") {
    issueSet.add("grade_scope_unverified");
  }
  if (vetted.examFit === "Not_JEE") {
    issueSet.add("not_jee_relevant");
  }
  if (vetted.difficulty === "easy") {
    issueSet.add("too_easy_for_jee");
  }
  if (vetted.diagramRequired && !vetted.diagramImageUrl) {
    issueSet.add("missing_required_diagram");
  }

  const finalIssues = Array.from(issueSet);
  const hardReject = finalIssues.some((code) => STRICT_HARD_REJECT_ISSUES.has(code));

  let qualityScore = vetted.qualityScore;
  if (vetted.gradeBand !== "class_11_12") {
    qualityScore = Math.min(qualityScore, 0.78);
  }
  if (vetted.examFit === "Not_JEE") {
    qualityScore = Math.min(qualityScore, 0.64);
  }
  if (vetted.difficulty === "easy") {
    qualityScore = Math.min(qualityScore, 0.79);
  }
  if (hardReject) {
    qualityScore = Math.min(qualityScore, 0.56);
  }

  return {
    ...vetted,
    issues: finalIssues,
    qualityScore: clampScore(qualityScore, vetted.qualityScore),
    reviewStatus: qualityScore >= STRICT_AUTO_PASS_MIN_SCORE && finalIssues.length === 0 ? "auto_pass" : "needs_review"
  };
}

function sanitizeFallback(input: VettableQuestion): VettedQuestion {
  const options = input.questionType === "mcq_single" ? normalizeOptionKeys(input.options || []) : [];
  const issues: string[] = [];

  if (input.questionType === "mcq_single" && options.length !== 4) {
    issues.push("invalid_options");
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

  const vetted: VettedQuestion = {
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
    qualityScore: issues.length === 0 ? 0.84 : 0.62,
    reviewStatus: "needs_review",
    issues,
    examFit: input.difficulty === "hard" ? "Advanced" : "Main",
    gradeBand: "unknown",
    diagramRequired: detectDiagramRequirement(`${input.stemMarkdown}\n${input.stemLatex || ""}`)
  };

  return applyStrictRules(vetted);
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
    "Validate and repair this JEE question with strict standards.",
    "Return STRICT JSON object only.",
    "Reject school-level (< class 11) or non-JEE level questions.",
    "Keep only academically correct, unambiguous, exam-style wording.",
    "Classify if question better fits JEE Main or JEE Advanced.",
    "Schema:",
    "{",
    '  "stemMarkdown": string,',
    '  "stemLatex": string|null,',
    '  "difficulty": "easy"|"medium"|"hard",',
    '  "options": [{"key":"A"|"B"|"C"|"D","text":string,"latex":string|null}] (for mcq else []),',
    '  "answer": {"answerType":"option_key"|"integer_value","correctOption":"A"|"B"|"C"|"D"|null,"correctInteger":number|null,"solutionMarkdown":string|null,"solutionLatex":string|null},',
    '  "diagramImageUrl": string|null,',
    '  "diagramCaption": string|null,',
    '  "diagramRequired": boolean,',
    '  "gradeBand": "class_11_12"|"below_11"|"outside_jee"|"unknown",',
    '  "examFit": "Main"|"Advanced"|"Not_JEE",',
    '  "qualityScore": number (0 to 0.99),',
    '  "issues": string[]',
    "}",
    "Issue codes should be snake_case. Use codes like: concept_error, ambiguous_prompt, missing_required_diagram, below_class_11, not_jee_relevant, multiple_correct_options.",
    `Input question JSON:\n${JSON.stringify(input)}`
  ].join("\n");

  try {
    const raw = await deepseekChat({
      messages: [
        {
          role: "system",
          content:
            `You are an expert JEE question quality reviewer using model ${model}. Be strict. Return strict JSON only. Do not use markdown fences.`
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.05,
      maxTokens: 2600
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
      correctOption: answerRaw.correctOption ? (String(answerRaw.correctOption).toUpperCase() as "A" | "B" | "C" | "D") : undefined,
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
      reviewStatus: qualityScore >= STRICT_AUTO_PASS_MIN_SCORE ? "auto_pass" : "needs_review",
      issues,
      examFit: parseExamFit(parsed.examFit, input.difficulty === "hard" ? "Advanced" : "Main"),
      gradeBand: parseGradeBand(parsed.gradeBand, "unknown"),
      diagramRequired:
        typeof parsed.diagramRequired === "boolean"
          ? parsed.diagramRequired
          : detectDiagramRequirement(`${String(parsed.stemMarkdown || fallback.stemMarkdown)}\n${String(parsed.stemLatex || "")}`)
    };

    if (vetted.questionType === "mcq_single" && vetted.options.length !== 4) {
      return applyStrictRules({
        ...fallback,
        qualityScore: Math.min(fallback.qualityScore, 0.58),
        issues: Array.from(new Set([...fallback.issues, "invalid_options"]))
      });
    }

    if (vetted.answer.answerType === "option_key") {
      const valid = ["A", "B", "C", "D"].includes(String(vetted.answer.correctOption || ""));
      if (!valid) {
        return applyStrictRules({
          ...fallback,
          qualityScore: Math.min(fallback.qualityScore, 0.55),
          issues: Array.from(new Set([...fallback.issues, "missing_correct_option"]))
        });
      }
    }

    if (vetted.answer.answerType === "integer_value" && !Number.isFinite(Number(vetted.answer.correctInteger))) {
      return applyStrictRules({
        ...fallback,
        qualityScore: Math.min(fallback.qualityScore, 0.55),
        issues: Array.from(new Set([...fallback.issues, "missing_integer_answer"]))
      });
    }

    return applyStrictRules(vetted);
  } catch {
    return fallback;
  }
}

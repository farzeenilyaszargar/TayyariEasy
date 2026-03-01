import "server-only";

import { supabaseRest } from "@/lib/supabase-server";

export type DifficultyKey = "easy" | "medium" | "hard";

export type TestBlueprintRow = {
  id: string;
  name: string;
  scope: "topic" | "subject" | "full_mock";
  subject: "Physics" | "Chemistry" | "Mathematics" | null;
  topic: string | null;
  question_count: number;
  distribution: Record<DifficultyKey, number>;
  duration_minutes: number;
  negative_marking: boolean;
  is_active: boolean;
};

export type QuestionRow = {
  id: string;
  question_type: "mcq_single" | "integer";
  stem_markdown: string;
  stem_latex: string | null;
  subject: "Physics" | "Chemistry" | "Mathematics";
  topic: string;
  subtopic: string | null;
  difficulty: DifficultyKey;
  marks: number;
  negative_marks: number;
};

export type QuestionOptionRow = {
  id: string;
  question_id: string;
  option_key: "A" | "B" | "C" | "D";
  option_text_markdown: string;
  option_latex: string | null;
};

export type QuestionAnswerRow = {
  question_id: string;
  answer_type: "option_key" | "integer_value";
  correct_option: "A" | "B" | "C" | "D" | null;
  correct_integer: number | null;
};

export function parseDistribution(input: unknown): Record<DifficultyKey, number> {
  const fallback = { easy: 30, medium: 50, hard: 20 };
  if (!input || typeof input !== "object") {
    return fallback;
  }
  const raw = input as Record<string, unknown>;
  const easy = Number(raw.easy);
  const medium = Number(raw.medium);
  const hard = Number(raw.hard);
  const total = easy + medium + hard;
  if (!Number.isFinite(total) || total <= 0) {
    return fallback;
  }
  return {
    easy: Math.max(0, easy),
    medium: Math.max(0, medium),
    hard: Math.max(0, hard)
  };
}

export function computeDifficultyCounts(total: number, distribution: Record<DifficultyKey, number>) {
  const sum = distribution.easy + distribution.medium + distribution.hard || 100;
  const easy = Math.floor((total * distribution.easy) / sum);
  const medium = Math.floor((total * distribution.medium) / sum);
  const used = easy + medium;
  const hard = Math.max(0, total - used);
  return { easy, medium, hard };
}

function seededShuffle<T>(items: T[], seed: string) {
  const arr = [...items];
  let state = 0;
  for (let i = 0; i < seed.length; i += 1) {
    state = (state * 31 + seed.charCodeAt(i)) >>> 0;
  }

  for (let i = arr.length - 1; i > 0; i -= 1) {
    state = (1664525 * state + 1013904223) >>> 0;
    const j = state % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function fetchActiveBlueprints(params?: {
  scope?: "topic" | "subject" | "full_mock";
  subject?: string;
  topic?: string;
}) {
  const filters: string[] = ["is_active=eq.true", "select=id,name,scope,subject,topic,question_count,distribution,duration_minutes,negative_marking,is_active", "order=name.asc"];
  if (params?.scope) {
    filters.push(`scope=eq.${params.scope}`);
  }
  if (params?.subject) {
    filters.push(`subject=eq.${encodeURIComponent(params.subject)}`);
  }
  if (params?.topic) {
    filters.push(`topic=eq.${encodeURIComponent(params.topic)}`);
  }

  const rows = await supabaseRest<Array<Omit<TestBlueprintRow, "distribution"> & { distribution: unknown }>>(
    `test_blueprints?${filters.join("&")}`,
    "GET"
  );

  return rows.map((row) => ({
    ...row,
    distribution: parseDistribution(row.distribution)
  }));
}

export async function pickQuestionsForBlueprint(blueprint: TestBlueprintRow, seed: string) {
  const scopeFilters: string[] = ["is_published=eq.true"];
  if (blueprint.scope === "topic" && blueprint.subject && blueprint.topic) {
    scopeFilters.push(`subject=eq.${encodeURIComponent(blueprint.subject)}`);
    scopeFilters.push(`topic=eq.${encodeURIComponent(blueprint.topic)}`);
  } else if (blueprint.scope === "subject" && blueprint.subject) {
    scopeFilters.push(`subject=eq.${encodeURIComponent(blueprint.subject)}`);
  }

  const baseSelect = "select=id,question_type,stem_markdown,stem_latex,subject,topic,subtopic,difficulty,marks,negative_marks";
  const queryBase = `question_bank?${baseSelect}&${scopeFilters.join("&")}`;

  const [easyPool, mediumPool, hardPool] = await Promise.all([
    supabaseRest<QuestionRow[]>(`${queryBase}&difficulty=eq.easy`, "GET"),
    supabaseRest<QuestionRow[]>(`${queryBase}&difficulty=eq.medium`, "GET"),
    supabaseRest<QuestionRow[]>(`${queryBase}&difficulty=eq.hard`, "GET")
  ]);

  const needed = computeDifficultyCounts(blueprint.question_count, blueprint.distribution);

  const selected: QuestionRow[] = [];
  const picked = new Set<string>();

  const take = (pool: QuestionRow[], count: number, localSeed: string) => {
    const shuffled = seededShuffle(pool, localSeed);
    for (const q of shuffled) {
      if (selected.length >= blueprint.question_count || count <= 0) {
        break;
      }
      if (picked.has(q.id)) {
        continue;
      }
      selected.push(q);
      picked.add(q.id);
      count -= 1;
    }
    return count;
  };

  const remainingEasy = take(easyPool, needed.easy, `${seed}:easy`);
  const remainingMedium = take(mediumPool, needed.medium + remainingEasy, `${seed}:medium`);
  const remainingHard = take(hardPool, needed.hard + remainingMedium, `${seed}:hard`);

  if (remainingHard > 0) {
    const fallbackPool = seededShuffle([...easyPool, ...mediumPool, ...hardPool], `${seed}:fallback`);
    for (const q of fallbackPool) {
      if (selected.length >= blueprint.question_count) {
        break;
      }
      if (picked.has(q.id)) {
        continue;
      }
      selected.push(q);
      picked.add(q.id);
    }
  }

  return selected.slice(0, blueprint.question_count);
}

export async function fetchOptionsForQuestions(questionIds: string[]) {
  if (questionIds.length === 0) {
    return [] as QuestionOptionRow[];
  }
  const inClause = questionIds.map((id) => `"${id}"`).join(",");
  return supabaseRest<QuestionOptionRow[]>(
    `question_options?select=id,question_id,option_key,option_text_markdown,option_latex&question_id=in.(${inClause})&order=option_key.asc`,
    "GET"
  );
}

export async function fetchAnswersForQuestions(questionIds: string[]) {
  if (questionIds.length === 0) {
    return [] as QuestionAnswerRow[];
  }
  const inClause = questionIds.map((id) => `"${id}"`).join(",");
  return supabaseRest<QuestionAnswerRow[]>(
    `question_answers?select=question_id,answer_type,correct_option,correct_integer&question_id=in.(${inClause})`,
    "GET"
  );
}

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
  diagram_image_url?: string | null;
  diagram_caption?: string | null;
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

const DEFAULT_BLUEPRINTS: Array<{
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
}> = [
  {
    id: "6ea0a10f-8e14-44ff-8f48-2bff2d35f101",
    name: "Physics Subject Master Test",
    scope: "subject",
    subject: "Physics",
    topic: null,
    question_count: 30,
    distribution: { easy: 25, medium: 50, hard: 25 },
    duration_minutes: 60,
    negative_marking: true,
    is_active: true
  },
  {
    id: "6ea0a10f-8e14-44ff-8f48-2bff2d35f102",
    name: "Chemistry Subject Master Test",
    scope: "subject",
    subject: "Chemistry",
    topic: null,
    question_count: 30,
    distribution: { easy: 25, medium: 50, hard: 25 },
    duration_minutes: 60,
    negative_marking: true,
    is_active: true
  },
  {
    id: "6ea0a10f-8e14-44ff-8f48-2bff2d35f103",
    name: "Mathematics Subject Master Test",
    scope: "subject",
    subject: "Mathematics",
    topic: null,
    question_count: 30,
    distribution: { easy: 20, medium: 50, hard: 30 },
    duration_minutes: 60,
    negative_marking: true,
    is_active: true
  },
  {
    id: "6ea0a10f-8e14-44ff-8f48-2bff2d35f201",
    name: "All India Full Syllabus Mock 01",
    scope: "full_mock",
    subject: null,
    topic: null,
    question_count: 75,
    distribution: { easy: 30, medium: 50, hard: 20 },
    duration_minutes: 180,
    negative_marking: true,
    is_active: true
  },
  {
    id: "6ea0a10f-8e14-44ff-8f48-2bff2d35f202",
    name: "All India Full Syllabus Mock 02",
    scope: "full_mock",
    subject: null,
    topic: null,
    question_count: 75,
    distribution: { easy: 28, medium: 50, hard: 22 },
    duration_minutes: 180,
    negative_marking: true,
    is_active: true
  },
  {
    id: "6ea0a10f-8e14-44ff-8f48-2bff2d35f203",
    name: "All India Full Syllabus Mock 03",
    scope: "full_mock",
    subject: null,
    topic: null,
    question_count: 75,
    distribution: { easy: 25, medium: 50, hard: 25 },
    duration_minutes: 180,
    negative_marking: true,
    is_active: true
  },
  {
    id: "6ea0a10f-8e14-44ff-8f48-2bff2d35f301",
    name: "Mechanics Topic Series",
    scope: "topic",
    subject: "Physics",
    topic: "Mechanics",
    question_count: 20,
    distribution: { easy: 30, medium: 50, hard: 20 },
    duration_minutes: 45,
    negative_marking: true,
    is_active: true
  },
  {
    id: "6ea0a10f-8e14-44ff-8f48-2bff2d35f302",
    name: "Electrodynamics Topic Series",
    scope: "topic",
    subject: "Physics",
    topic: "Electrodynamics",
    question_count: 20,
    distribution: { easy: 25, medium: 50, hard: 25 },
    duration_minutes: 45,
    negative_marking: true,
    is_active: true
  },
  {
    id: "6ea0a10f-8e14-44ff-8f48-2bff2d35f303",
    name: "Organic Chemistry Topic Series",
    scope: "topic",
    subject: "Chemistry",
    topic: "Organic Chemistry",
    question_count: 20,
    distribution: { easy: 25, medium: 50, hard: 25 },
    duration_minutes: 45,
    negative_marking: true,
    is_active: true
  },
  {
    id: "6ea0a10f-8e14-44ff-8f48-2bff2d35f304",
    name: "Physical Chemistry Topic Series",
    scope: "topic",
    subject: "Chemistry",
    topic: "Physical Chemistry",
    question_count: 20,
    distribution: { easy: 30, medium: 50, hard: 20 },
    duration_minutes: 45,
    negative_marking: true,
    is_active: true
  },
  {
    id: "6ea0a10f-8e14-44ff-8f48-2bff2d35f305",
    name: "Calculus Topic Series",
    scope: "topic",
    subject: "Mathematics",
    topic: "Calculus",
    question_count: 20,
    distribution: { easy: 20, medium: 50, hard: 30 },
    duration_minutes: 45,
    negative_marking: true,
    is_active: true
  },
  {
    id: "6ea0a10f-8e14-44ff-8f48-2bff2d35f306",
    name: "Algebra Topic Series",
    scope: "topic",
    subject: "Mathematics",
    topic: "Algebra",
    question_count: 20,
    distribution: { easy: 25, medium: 50, hard: 25 },
    duration_minutes: 45,
    negative_marking: true,
    is_active: true
  }
];

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

const CORE_TOPICS_BY_SUBJECT: Record<"Physics" | "Chemistry" | "Mathematics", string[]> = {
  Physics: [
    "Mechanics",
    "Properties of Matter",
    "Thermodynamics",
    "Oscillations and Waves",
    "Electrodynamics",
    "Optics",
    "Modern Physics"
  ],
  Chemistry: [
    "Physical Chemistry",
    "Organic Chemistry",
    "Inorganic Chemistry",
    "Thermodynamics",
    "Chemical Kinetics",
    "Coordination Compounds"
  ],
  Mathematics: [
    "Algebra",
    "Calculus",
    "Coordinate Geometry",
    "Vector and 3D Geometry",
    "Probability",
    "Trigonometry"
  ]
};

function splitAcrossSubjects(total: number) {
  const subjects: Array<"Physics" | "Chemistry" | "Mathematics"> = ["Physics", "Chemistry", "Mathematics"];
  const base = Math.floor(total / subjects.length);
  let remainder = total - base * subjects.length;
  const result = new Map<"Physics" | "Chemistry" | "Mathematics", number>();
  for (const subject of subjects) {
    const extra = remainder > 0 ? 1 : 0;
    result.set(subject, base + extra);
    remainder = Math.max(0, remainder - 1);
  }
  return result;
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

  await ensureDefaultBlueprints();

  const rows = await supabaseRest<Array<Omit<TestBlueprintRow, "distribution"> & { distribution: unknown }>>(
    `test_blueprints?${filters.join("&")}`,
    "GET"
  );

  return rows.map((row) => ({
    ...row,
    distribution: parseDistribution(row.distribution)
  }));
}

export async function ensureDefaultBlueprints() {
  await supabaseRest(
    "test_blueprints?on_conflict=id",
    "POST",
    DEFAULT_BLUEPRINTS,
    "resolution=merge-duplicates,return=minimal"
  );
}

export async function pickQuestionsForBlueprint(blueprint: TestBlueprintRow, seed: string) {
  const scopeFilters: string[] = [];
  if (blueprint.scope === "topic" && blueprint.subject && blueprint.topic) {
    scopeFilters.push(`subject=eq.${encodeURIComponent(blueprint.subject)}`);
    scopeFilters.push(`topic=eq.${encodeURIComponent(blueprint.topic)}`);
  } else if (blueprint.scope === "subject" && blueprint.subject) {
    scopeFilters.push(`subject=eq.${encodeURIComponent(blueprint.subject)}`);
  }

  const baseSelect = "select=id,question_type,stem_markdown,stem_latex,subject,topic,subtopic,difficulty,marks,negative_marks";
  const buildPools = async (extraFilters: string[]) => {
    const allFilters = [...scopeFilters, ...extraFilters];
    const queryBase = `question_bank?${baseSelect}&${allFilters.join("&")}`;
    return Promise.all([
      supabaseRest<QuestionRow[]>(`${queryBase}&difficulty=eq.easy`, "GET"),
      supabaseRest<QuestionRow[]>(`${queryBase}&difficulty=eq.medium`, "GET"),
      supabaseRest<QuestionRow[]>(`${queryBase}&difficulty=eq.hard`, "GET")
    ]);
  };

  let [easyPool, mediumPool, hardPool] = await buildPools(["is_published=eq.true"]);

  if (easyPool.length + mediumPool.length + hardPool.length === 0) {
    // Fallback for practice mode when reviewed/published inventory is empty.
    [easyPool, mediumPool, hardPool] = await buildPools(["review_status=neq.rejected"]);
  }

  const selected: QuestionRow[] = [];
  const picked = new Set<string>();

  const take = (pool: QuestionRow[], count: number, localSeed: string, predicate?: (q: QuestionRow) => boolean) => {
    const shuffled = seededShuffle(pool, localSeed);
    for (const q of shuffled) {
      if (selected.length >= blueprint.question_count || count <= 0) {
        break;
      }
      if (picked.has(q.id)) {
        continue;
      }
      if (predicate && !predicate(q)) {
        continue;
      }
      selected.push(q);
      picked.add(q.id);
      count -= 1;
    }
    return count;
  };

  if (blueprint.scope === "topic") {
    const needed = computeDifficultyCounts(blueprint.question_count, blueprint.distribution);
    const remainingEasy = take(easyPool, needed.easy, `${seed}:topic:easy`);
    const remainingMedium = take(mediumPool, needed.medium + remainingEasy, `${seed}:topic:medium`);
    const remainingHard = take(hardPool, needed.hard + remainingMedium, `${seed}:topic:hard`);

    if (remainingHard > 0) {
      const fallbackPool = seededShuffle([...easyPool, ...mediumPool, ...hardPool], `${seed}:topic:fallback`);
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

  const subjectTargets: Map<"Physics" | "Chemistry" | "Mathematics", number> =
    blueprint.scope === "full_mock"
      ? splitAcrossSubjects(blueprint.question_count)
      : blueprint.subject
        ? new Map<"Physics" | "Chemistry" | "Mathematics", number>([
            [blueprint.subject as "Physics" | "Chemistry" | "Mathematics", blueprint.question_count]
          ])
        : new Map<"Physics" | "Chemistry" | "Mathematics", number>();

  // First pass: ensure each subject test includes important topics.
  for (const [subject, quota] of subjectTargets) {
    const topics = CORE_TOPICS_BY_SUBJECT[subject] || [];
    const topicLimit = Math.min(topics.length, Math.max(0, quota - 8));
    for (let i = 0; i < topicLimit; i += 1) {
      const topic = topics[i];
      const predicate = (q: QuestionRow) => q.subject === subject && q.topic === topic;
      let remaining = take(mediumPool, 1, `${seed}:${subject}:${topic}:medium`, predicate);
      if (remaining > 0) {
        remaining = take(hardPool, remaining, `${seed}:${subject}:${topic}:hard`, predicate);
      }
      if (remaining > 0) {
        take(easyPool, remaining, `${seed}:${subject}:${topic}:easy`, predicate);
      }
    }
  }

  // Second pass: satisfy per-subject quotas while preserving difficulty mix.
  for (const [subject, quota] of subjectTargets) {
    const currentForSubject = selected.filter((q) => q.subject === subject);
    if (currentForSubject.length >= quota) {
      continue;
    }

    const subjectNeed = computeDifficultyCounts(quota, blueprint.distribution);
    const subjectHave = {
      easy: currentForSubject.filter((q) => q.difficulty === "easy").length,
      medium: currentForSubject.filter((q) => q.difficulty === "medium").length,
      hard: currentForSubject.filter((q) => q.difficulty === "hard").length
    };
    const subjectPredicate = (q: QuestionRow) => q.subject === subject;

    take(easyPool, Math.max(0, subjectNeed.easy - subjectHave.easy), `${seed}:${subject}:easy`, subjectPredicate);
    take(
      mediumPool,
      Math.max(0, subjectNeed.medium - subjectHave.medium),
      `${seed}:${subject}:medium`,
      subjectPredicate
    );
    take(hardPool, Math.max(0, subjectNeed.hard - subjectHave.hard), `${seed}:${subject}:hard`, subjectPredicate);

    const stillNeeded = quota - selected.filter((q) => q.subject === subject).length;
    if (stillNeeded > 0) {
      const fallbackPool = seededShuffle([...mediumPool, ...hardPool, ...easyPool], `${seed}:${subject}:fill`);
      for (const q of fallbackPool) {
        if (selected.length >= blueprint.question_count) {
          break;
        }
        if (picked.has(q.id) || q.subject !== subject) {
          continue;
        }
        selected.push(q);
        picked.add(q.id);
        if (selected.filter((item) => item.subject === subject).length >= quota) {
          break;
        }
      }
    }
  }

  // Final pass: top up by global difficulty distribution if gaps remain.
  if (selected.length < blueprint.question_count) {
    const globalNeed = computeDifficultyCounts(blueprint.question_count, blueprint.distribution);
    const globalHave = {
      easy: selected.filter((q) => q.difficulty === "easy").length,
      medium: selected.filter((q) => q.difficulty === "medium").length,
      hard: selected.filter((q) => q.difficulty === "hard").length
    };

    take(easyPool, Math.max(0, globalNeed.easy - globalHave.easy), `${seed}:global:easy`);
    take(mediumPool, Math.max(0, globalNeed.medium - globalHave.medium), `${seed}:global:medium`);
    take(hardPool, Math.max(0, globalNeed.hard - globalHave.hard), `${seed}:global:hard`);
  }

  if (selected.length < blueprint.question_count) {
    const fallbackPool = seededShuffle([...mediumPool, ...hardPool, ...easyPool], `${seed}:global:fallback`);
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

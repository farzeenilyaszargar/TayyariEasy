import { callInternal } from "./http.js";

const TARGET_TOTAL = Math.max(500, Number(process.env.TARGET_QUESTION_BANK_SIZE || 800));
const GENERATE_COUNT_PER_TARGET = Math.max(2, Math.min(12, Number(process.env.GENERATE_COUNT_PER_TARGET || 6)));
const MAX_ROUNDS = Math.max(1, Number(process.env.BACKFILL_MAX_ROUNDS || 40));

const targets = [
  { subject: "Physics", topic: "Mechanics", subtopic: "Laws of Motion" },
  { subject: "Physics", topic: "Mechanics", subtopic: "Work Power Energy" },
  { subject: "Physics", topic: "Mechanics", subtopic: "Rotational Motion" },
  { subject: "Physics", topic: "Electrodynamics", subtopic: "Current Electricity" },
  { subject: "Physics", topic: "Electrodynamics", subtopic: "Capacitance" },
  { subject: "Physics", topic: "Modern Physics", subtopic: "Atomic Models" },
  { subject: "Physics", topic: "Optics", subtopic: "Ray Optics" },
  { subject: "Chemistry", topic: "Physical Chemistry", subtopic: "Mole Concept" },
  { subject: "Chemistry", topic: "Physical Chemistry", subtopic: "Thermodynamics" },
  { subject: "Chemistry", topic: "Physical Chemistry", subtopic: "Electrochemistry" },
  { subject: "Chemistry", topic: "Organic Chemistry", subtopic: "GOC" },
  { subject: "Chemistry", topic: "Organic Chemistry", subtopic: "Hydrocarbons" },
  { subject: "Chemistry", topic: "Inorganic Chemistry", subtopic: "Chemical Bonding" },
  { subject: "Chemistry", topic: "Inorganic Chemistry", subtopic: "Coordination Compounds" },
  { subject: "Mathematics", topic: "Algebra", subtopic: "Quadratic Equations" },
  { subject: "Mathematics", topic: "Algebra", subtopic: "Complex Numbers" },
  { subject: "Mathematics", topic: "Calculus", subtopic: "Limits and Continuity" },
  { subject: "Mathematics", topic: "Calculus", subtopic: "Differentiation" },
  { subject: "Mathematics", topic: "Calculus", subtopic: "Definite Integration" },
  { subject: "Mathematics", topic: "Coordinate Geometry", subtopic: "Straight Line" },
  { subject: "Mathematics", topic: "Coordinate Geometry", subtopic: "Circle" },
  { subject: "Mathematics", topic: "Probability", subtopic: "Conditional Probability" }
];

const difficulties = ["easy", "medium", "hard"];

function pickDifficulty(round, index) {
  return difficulties[(round + index) % difficulties.length];
}

async function getStats() {
  const stats = await callInternal("/internal/ingest/stats", {});
  return {
    total: Number(stats.total || 0),
    published: Number(stats.published || 0)
  };
}

async function run() {
  const before = await getStats();
  console.log(`Question bank before backfill: total=${before.total}, published=${before.published}`);

  let insertedTotal = 0;

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const stats = await getStats();
    if (stats.total >= TARGET_TOTAL) {
      console.log(`Target reached. total=${stats.total}, published=${stats.published}`);
      break;
    }

    console.log(`Backfill round ${round + 1}/${MAX_ROUNDS} ...`);

    for (let i = 0; i < targets.length; i += 1) {
      const t = targets[i];
      const difficulty = pickDifficulty(round, i);

      const generated = await callInternal("/internal/generate/questions", {
        subject: t.subject,
        topic: t.topic,
        subtopic: t.subtopic,
        difficulty,
        count: GENERATE_COUNT_PER_TARGET,
        examPhase: round % 2 === 0 ? "Main" : "Advanced",
        examYear: 2019 + (round % 7),
        autoVet: true
      });

      const items = Array.isArray(generated.items) ? generated.items : [];
      if (items.length === 0) {
        continue;
      }

      const withProvenance = items.map((item) => ({
        ...item,
        useAiVetting: false,
        publish: item.publish === true,
        provenance: {
          sourceUrl: "https://generated.tayyari.local/deepseek",
          sourceQuestionRef: `${t.subject}-${t.topic}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          extractionConfidence: 0.93
        }
      }));

      const ingested = await callInternal("/internal/ingest/questions/bulk", {
        questions: withProvenance
      });

      const inserted = Number(ingested.inserted || 0);
      insertedTotal += inserted;

      const live = await getStats();
      console.log(
        `[${t.subject}/${t.topic}/${difficulty}] generated=${items.length} inserted=${inserted} total=${live.total} published=${live.published}`
      );

      if (live.total >= TARGET_TOTAL) {
        break;
      }
    }
  }

  const after = await getStats();
  console.log(`Backfill complete. inserted=${insertedTotal}, total=${after.total}, published=${after.published}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

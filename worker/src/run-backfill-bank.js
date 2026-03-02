import { callInternal } from "./http.js";
import { flattenJeeTargets } from "./jee-targets.js";

const TARGET_TOTAL = Math.max(1000, Number(process.env.TARGET_QUESTION_BANK_SIZE || 1200));
const PER_TARGET_COUNT = Math.max(2, Math.min(10, Number(process.env.GENERATE_COUNT_PER_TARGET || 5)));
const TARGET_MIN_PER_TOPIC = Math.max(6, Number(process.env.TARGET_MIN_PER_TOPIC || 12));
const ROUND_TARGETS = Math.max(6, Number(process.env.BACKFILL_TARGETS_PER_ROUND || 18));
const MAX_ROUNDS = Math.max(1, Number(process.env.BACKFILL_MAX_ROUNDS || 60));

const SOURCE_BY_SUBJECT = {
  Physics: "https://jeemain.nta.ac.in/question-papers",
  Chemistry: "https://jeemain.nta.ac.in/question-papers",
  Mathematics: "https://jeemain.nta.ac.in/question-papers"
};

function topicKey(subject, topic) {
  return `${subject}::${topic}`;
}

function difficultyForTarget(target, round, slot) {
  if (target.phaseBias === "Advanced") {
    return (round + slot) % 2 === 0 ? "hard" : "medium";
  }
  return (round + slot) % 4 === 0 ? "hard" : "medium";
}

async function getStats() {
  const stats = await callInternal("/internal/ingest/stats", {});
  return {
    total: Number(stats.total || 0),
    published: Number(stats.published || 0),
    byTopic: stats.byTopic && typeof stats.byTopic === "object" ? stats.byTopic : {}
  };
}

function chooseRoundTargets(allTargets, byTopic, count) {
  const scored = allTargets.map((target) => {
    const current = Number(byTopic[topicKey(target.subject, target.topic)] || 0);
    const deficit = Math.max(0, TARGET_MIN_PER_TOPIC - current);
    return { ...target, current, deficit };
  });

  scored.sort((a, b) => {
    if (b.deficit !== a.deficit) {
      return b.deficit - a.deficit;
    }
    if (a.subject !== b.subject) {
      return a.subject.localeCompare(b.subject);
    }
    return a.topic.localeCompare(b.topic) || a.subtopic.localeCompare(b.subtopic);
  });

  return scored.slice(0, count);
}

export async function runBackfillBank() {
  const allTargets = flattenJeeTargets();
  let insertedTotal = 0;

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const stats = await getStats();
    if (stats.total >= TARGET_TOTAL) {
      console.log(`Target reached. total=${stats.total} published=${stats.published}`);
      break;
    }

    const selectedTargets = chooseRoundTargets(allTargets, stats.byTopic, ROUND_TARGETS);
    console.log(
      `Backfill round ${round + 1}/${MAX_ROUNDS} start total=${stats.total} published=${stats.published} targets=${selectedTargets.length}`
    );

    for (let idx = 0; idx < selectedTargets.length; idx += 1) {
      const target = selectedTargets[idx];
      const difficulty = difficultyForTarget(target, round, idx);
      const examPhase = target.phaseBias === "Advanced" ? "Advanced" : "Main";

      const generated = await callInternal("/internal/generate/questions", {
        subject: target.subject,
        topic: target.topic,
        subtopic: target.subtopic,
        difficulty,
        count: PER_TARGET_COUNT,
        examPhase,
        examYear: 2026,
        autoVet: true,
        preferDiagrams: target.diagramFriendly
      });

      const items = Array.isArray(generated.items) ? generated.items : [];
      if (items.length === 0) {
        continue;
      }

      const ingested = await callInternal("/internal/ingest/questions/bulk", {
        questions: items.map((item) => ({
          ...item,
          useAiVetting: false,
          provenance: {
            sourceUrl: SOURCE_BY_SUBJECT[target.subject] || "https://jeemain.nta.ac.in/question-papers",
            sourceQuestionRef: `${target.subject}-${target.topic}-${target.subtopic}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            extractionConfidence: 0.91
          }
        }))
      });

      const inserted = Number(ingested.inserted || 0);
      insertedTotal += inserted;

      const live = await getStats();
      console.log(
        `[${target.subject}/${target.topic}/${target.subtopic}] deficit=${target.deficit} diff=${difficulty} phase=${examPhase} generated=${items.length} inserted=${inserted} total=${live.total} published=${live.published}`
      );

      if (live.total >= TARGET_TOTAL) {
        break;
      }
    }

    await callInternal("/internal/ingest/questions/vet", {
      limit: 80,
      onlyUnvetted: true,
      publishOnHighQuality: true,
      minQualityToPublish: 0.93,
      strictMode: true
    });
  }

  // Final strict sweep.
  for (let i = 0; i < 6; i += 1) {
    const sweep = await callInternal("/internal/ingest/questions/vet", {
      limit: 80,
      onlyUnvetted: true,
      publishOnHighQuality: true,
      minQualityToPublish: 0.93,
      strictMode: true
    });
    if (Number(sweep.processed || 0) === 0) {
      break;
    }
  }

  const after = await getStats();
  console.log(
    `Backfill complete. inserted=${insertedTotal} total=${after.total} published=${after.published} target=${TARGET_TOTAL}`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runBackfillBank().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

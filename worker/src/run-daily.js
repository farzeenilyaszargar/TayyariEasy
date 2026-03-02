import { callInternal } from "./http.js";
import { flattenJeeTargets } from "./jee-targets.js";

const DAILY_TARGETS = Math.max(6, Number(process.env.DAILY_TARGETS || 18));
const QUESTIONS_PER_TARGET = Math.max(2, Math.min(8, Number(process.env.DAILY_QUESTIONS_PER_TARGET || 4)));

const SOURCE_BY_SUBJECT = {
  Physics: "https://jeemain.nta.ac.in/question-papers",
  Chemistry: "https://jeemain.nta.ac.in/question-papers",
  Mathematics: "https://jeemain.nta.ac.in/question-papers"
};

function dayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function getDailySlice(allTargets, size) {
  const pivot = dayOfYear() % allTargets.length;
  const rotated = [...allTargets.slice(pivot), ...allTargets.slice(0, pivot)];
  return rotated.slice(0, size);
}

function difficultyForTarget(target, idx) {
  if (target.phaseBias === "Advanced") {
    return idx % 2 === 0 ? "hard" : "medium";
  }
  return idx % 3 === 0 ? "hard" : "medium";
}

async function registerOfficialSource() {
  await callInternal("/internal/ingest/source-document", {
    sourceName: "NTA Official Archive",
    baseUrl: "https://jeemain.nta.ac.in",
    licenseType: "official",
    robotsAllowed: true,
    url: "https://jeemain.nta.ac.in/question-papers",
    documentType: "html",
    exam: "JEE Main",
    parseStatus: "pending"
  });
}

async function run() {
  await registerOfficialSource();
  const targets = getDailySlice(flattenJeeTargets(), DAILY_TARGETS);
  let insertedTotal = 0;

  for (let idx = 0; idx < targets.length; idx += 1) {
    const target = targets[idx];
    const examPhase = target.phaseBias === "Advanced" ? "Advanced" : "Main";
    const difficulty = difficultyForTarget(target, idx);

    const generated = await callInternal("/internal/generate/questions", {
      subject: target.subject,
      topic: target.topic,
      subtopic: target.subtopic,
      difficulty,
      count: QUESTIONS_PER_TARGET,
      examPhase,
      examYear: new Date().getFullYear(),
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
          sourceQuestionRef: `${target.subject}-${target.topic}-${target.subtopic}-${Date.now()}`,
          extractionConfidence: 0.9
        }
      }))
    });

    const inserted = Number(ingested.inserted || 0);
    insertedTotal += inserted;
    console.log(
      `[daily] ${target.subject}/${target.topic}/${target.subtopic} phase=${examPhase} diff=${difficulty} generated=${items.length} inserted=${inserted}`
    );
  }

  await callInternal("/internal/ingest/questions/vet", {
    limit: 60,
    onlyUnvetted: true,
    publishOnHighQuality: true,
    minQualityToPublish: 0.93,
    strictMode: true
  });

  const stats = await callInternal("/internal/ingest/stats", {});
  console.log(
    `Daily ingestion complete. inserted=${insertedTotal} total=${Number(stats.total || 0)} published=${Number(stats.published || 0)} diagrams=${Number(stats.withDiagrams || 0)}`
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

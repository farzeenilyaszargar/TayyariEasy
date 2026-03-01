import { callInternal } from "./http.js";

async function run() {
  const targets = [
    { subject: "Physics", topic: "Electrodynamics", subtopic: "Capacitance", difficulty: "hard", count: 6 },
    { subject: "Chemistry", topic: "Organic Chemistry", subtopic: "Aldehydes and Ketones", difficulty: "medium", count: 6 },
    { subject: "Mathematics", topic: "Calculus", subtopic: "Definite Integration", difficulty: "medium", count: 6 }
  ];

  let inserted = 0;

  for (const target of targets) {
    const generated = await callInternal("/internal/generate/questions", {
      ...target,
      autoVet: true,
      examPhase: "Main",
      examYear: 2025
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
          sourceUrl: "https://generated.tayyari.local/deepseek",
          sourceQuestionRef: `${target.subject}-${target.topic}-${Date.now()}`,
          extractionConfidence: 0.92
        }
      }))
    });

    inserted += Number(ingested.inserted || 0);
  }

  console.log(`Coverage-gap generation completed. Inserted/updated: ${inserted}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

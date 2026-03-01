import { callInternal } from "./http.js";

async function run() {
  const sampleSource = {
    sourceName: "NTA Official",
    baseUrl: "https://jeemain.nta.ac.in",
    licenseType: "official",
    robotsAllowed: true,
    url: "https://jeemain.nta.ac.in/question-papers",
    documentType: "html",
    exam: "JEE Main",
    parseStatus: "pending"
  };

  await callInternal("/internal/ingest/source-document", sampleSource);

  // Replace with real parser output adapters.
  const sampleQuestions = [
    {
      dedupeFingerprint: "sample-phy-kinematics-001",
      questionType: "mcq_single",
      stemMarkdown: "A particle starts from rest and moves with constant acceleration. Which graph is linear?",
      subject: "Physics",
      topic: "Mechanics",
      subtopic: "Kinematics",
      difficulty: "easy",
      sourceKind: "historical",
      examYear: 2024,
      examPhase: "Main",
      qualityScore: 0.91,
      reviewStatus: "auto_pass",
      publish: true,
      options: [
        { key: "A", text: "Displacement vs time" },
        { key: "B", text: "Velocity vs time" },
        { key: "C", text: "Acceleration vs time^2" },
        { key: "D", text: "Kinetic energy vs time" }
      ],
      answer: {
        answerType: "option_key",
        correctOption: "B",
        solutionMarkdown: "For constant acceleration, v = u + at, so velocity varies linearly with time."
      },
      provenance: {
        sourceUrl: "https://jeemain.nta.ac.in/question-papers",
        extractionConfidence: 0.9
      }
    }
  ];

  await callInternal("/internal/ingest/questions/bulk", { questions: sampleQuestions });
  console.log("Daily ingestion completed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

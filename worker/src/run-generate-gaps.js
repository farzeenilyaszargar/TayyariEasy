import { callInternal } from "./http.js";

async function run() {
  const targets = [
    { subject: "Physics", topic: "Electrodynamics", subtopic: "Capacitance", difficulty: "hard", count: 5 },
    { subject: "Chemistry", topic: "Organic Chemistry", subtopic: "Aldehydes and Ketones", difficulty: "medium", count: 5 },
    { subject: "Mathematics", topic: "Calculus", subtopic: "Definite Integration", difficulty: "medium", count: 5 }
  ];

  for (const target of targets) {
    await callInternal("/internal/generate/questions", target);
  }

  console.log("Coverage-gap generation jobs started.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

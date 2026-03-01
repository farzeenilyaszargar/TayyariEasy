import { callInternal } from "./http.js";

async function run() {
  // Weekly deep scan placeholder.
  await callInternal("/internal/ingest/source-document", {
    sourceName: "Weekly Deep Scan",
    baseUrl: "https://example-free-source.org",
    licenseType: "open",
    robotsAllowed: true,
    url: "https://example-free-source.org/jee-archive",
    documentType: "html",
    parseStatus: "pending"
  });

  console.log("Weekly ingestion kick-off completed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

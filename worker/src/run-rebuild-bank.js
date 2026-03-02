import { callInternal } from "./http.js";
import { runWeeklySourceDiscovery } from "./run-weekly.js";
import { runBackfillBank } from "./run-backfill-bank.js";

const RESET_BANK_FIRST = process.env.RESET_BANK_FIRST !== "false";
const PRESERVE_SOURCES = process.env.PRESERVE_SOURCES !== "false";
const PRESERVE_BLUEPRINTS = process.env.PRESERVE_BLUEPRINTS !== "false";

export async function runRebuildBank() {
  if (RESET_BANK_FIRST) {
    const reset = await callInternal("/internal/ingest/bank/reset", {
      preserveSources: PRESERVE_SOURCES,
      preserveBlueprints: PRESERVE_BLUEPRINTS
    });
    console.log(
      `Bank reset complete. before.questions=${reset.before?.questions ?? "?"} after.questions=${reset.after?.questions ?? "?"}`
    );
  } else {
    console.log("Bank reset skipped (RESET_BANK_FIRST=false).");
  }

  await runWeeklySourceDiscovery();
  await runBackfillBank();

  const finalStats = await callInternal("/internal/ingest/stats", {});
  console.log(
    `Rebuild complete. total=${Number(finalStats.total || 0)} published=${Number(finalStats.published || 0)} diagrams=${Number(finalStats.withDiagrams || 0)}`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runRebuildBank().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

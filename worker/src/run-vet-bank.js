import { callInternal } from "./http.js";

const BATCH = Math.max(5, Math.min(80, Number(process.env.VET_BATCH_SIZE || 25)));
const MAX_ROUNDS = Math.max(1, Number(process.env.VET_MAX_ROUNDS || 120));

async function run() {
  let processed = 0;
  let updated = 0;
  let published = 0;

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const res = await callInternal("/internal/ingest/questions/vet", {
      limit: BATCH,
      onlyUnvetted: true,
      publishOnHighQuality: true,
      minQualityToPublish: 0.88
    });

    const batchProcessed = Number(res.processed || 0);
    const batchUpdated = Number(res.updated || 0);
    const batchPublished = Number(res.published || 0);

    processed += batchProcessed;
    updated += batchUpdated;
    published += batchPublished;

    console.log(
      `Vetting round ${round + 1}: processed=${batchProcessed} updated=${batchUpdated} published=${batchPublished}`
    );

    if (batchProcessed === 0) {
      break;
    }
  }

  console.log(`Vetting complete. processed=${processed} updated=${updated} published=${published}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

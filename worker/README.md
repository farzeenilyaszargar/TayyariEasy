# Tayyari Ingestion Worker (External)

This worker runs outside Next.js runtime and calls internal ingestion endpoints.

## Env

- `APP_BASE_URL` (e.g. `https://your-domain.com`)
- `INTERNAL_INGEST_TOKEN` (must match Next app env)

Optional:
- `COVERAGE_START_YEAR` (default `2019`)
- `COVERAGE_END_YEAR` (default `2025`)

## Run

```bash
cd worker
npm run ingest:daily
npm run ingest:weekly
npm run generate:gaps
npm run bank:vet
npm run bank:backfill
```

## Scale to 500-1000 Questions

1. Ensure Next app is running (`npm run dev` in project root).
2. Ensure worker `.env` has:
   - `APP_BASE_URL=http://localhost:3000`
   - `INTERNAL_INGEST_TOKEN=<same as root .env.local>`
3. Run AI vetting for current bank:
   - `npm run bank:vet`
4. Run backfill until target size:
   - `TARGET_QUESTION_BANK_SIZE=800 npm run bank:backfill`

Useful env knobs:
- `TARGET_QUESTION_BANK_SIZE` (default `800`)
- `GENERATE_COUNT_PER_TARGET` (default `6`)
- `BACKFILL_MAX_ROUNDS` (default `40`)
- `VET_BATCH_SIZE` (default `25`)
- `VET_MAX_ROUNDS` (default `120`)

## Notes

- Source adapters should enforce free/public source policy and robots checks.
- Save source snapshots and metadata before bulk question ingestion.
- Route low-confidence records to review queue via bulk payload `reviewStatus: "needs_review"`.

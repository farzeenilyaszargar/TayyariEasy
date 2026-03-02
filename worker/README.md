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
npm run bank:rebuild
```

## Scale to 1000+ Questions

1. Ensure Next app is running (`npm run dev` in project root).
2. Ensure worker `.env` has:
   - `APP_BASE_URL=http://localhost:3000`
   - `INTERNAL_INGEST_TOKEN=<same as root .env.local>`
3. Run AI vetting for current bank:
   - `npm run bank:vet`
4. Run backfill until target size:
   - `TARGET_QUESTION_BANK_SIZE=1200 npm run bank:backfill`
5. Full reset + rebuild from scratch:
   - `TARGET_QUESTION_BANK_SIZE=1200 npm run bank:rebuild`

Useful env knobs:
- `TARGET_QUESTION_BANK_SIZE` (default `1200`)
- `GENERATE_COUNT_PER_TARGET` (default `5`)
- `TARGET_MIN_PER_TOPIC` (default `12`)
- `BACKFILL_TARGETS_PER_ROUND` (default `18`)
- `BACKFILL_MAX_ROUNDS` (default `60`)
- `VET_BATCH_SIZE` (default `25`)
- `VET_MAX_ROUNDS` (default `120`)
- `ALLOW_PROPRIETARY_BOOK_REFERENCES` (default `false`; metadata only)
- `RESET_BANK_FIRST` (default `true` for `bank:rebuild`)

## Notes

- Source adapters should enforce free/public source policy and robots checks.
- Save source snapshots and metadata before bulk question ingestion.
- Strict gate now blocks low-quality / non-JEE / below-class-11 / too-easy questions from publishing.
- Diagram-compatible topics are prioritized during daily/backfill generation.
- Proprietary books should only be used with licensed content; by default only metadata references are registered.

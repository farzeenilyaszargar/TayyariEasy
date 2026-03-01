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
```

## Notes

- Source adapters should enforce free/public source policy and robots checks.
- Save source snapshots and metadata before bulk question ingestion.
- Route low-confidence records to review queue via bulk payload `reviewStatus: "needs_review"`.

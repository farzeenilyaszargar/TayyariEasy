# Tayyari — tayyari.online

Free JEE mock tests with leaderboards, badges and Pro deep analysis.

## Run locally
```bash
npm install
npm run dev
```

## Structure
- `app/` — pages: home, tests, exam screen (`tests/[id]/attempt`), results, leaderboard, badges, dashboard, pricing, login
- `data/` — sample question bank and test papers (to move into Supabase)
- `lib/config.ts` — free-tier limit, marking scheme, pricing label
- `lib/scoring.ts` — JEE marking + analysis (free and Pro insights)
- `lib/quota.ts` — free plan: 2 tests per week (Mon reset)
- `lib/badges.ts`, `lib/leaderboard.ts` — gamification
- `lib/store.ts` — data layer (currently browser localStorage; Supabase next)

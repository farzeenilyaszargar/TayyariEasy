# TayyariEasy (Next.js)

Simple all-in-one JEE preparation UI with:
- Marketing page
- Auth-aware home page (hero when logged out, dashboard when logged in)
- Tests page (topic-wise + full syllabus)
- Problems chatbot page (UI + backend placeholder)
- Leaderboards page
- Resources downloads page
- Dashboard gamification (points + badges)

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Supabase Auth Setup

1. Create `.env.local` from `.env.example`.
2. Fill:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DEEPSEEK_API_KEY`
   - optional: `DEEPSEEK_MODEL` (default `deepseek-chat`)
3. In Supabase dashboard:
   - Enable Google provider in `Authentication -> Providers`.
   - Enable Phone provider (OTP/SMS).
   - Add `http://localhost:3000/login` (and production login URL) to allowed redirect URLs.
4. Run SQL setup from `supabase/schema.sql` inside Supabase SQL Editor.
   - This creates all app tables and seeds tests/resources.
   - Re-run this SQL after pulling latest schema changes.

Then use `/login` for Google sign-in or phone OTP auth.

## AI Endpoints

- `POST /api/ai/problems` for problems chat
- `POST /api/ai/dashboard` for dashboard coach analysis

Both use the server-side DeepSeek key from `.env.local`.

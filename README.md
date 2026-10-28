# Tayyari — tayyari.online

Free JEE mock tests with leaderboards, badges, points and Pro deep analysis.

## Run locally
```bash
npm install
cp .env.example .env.local   # then fill in the secrets
npm run dev
```

## Stack
- **Next.js 15** (App Router) — UI and the Razorpay API routes
- **Supabase** (project `tayyari`, ref `xgukepyyaplsyiaifjji`) — auth, Postgres, row-level security
- **Razorpay** — Pro payments

## How it works
| Piece | Where |
|---|---|
| Auth (mobile OTP, email OTP/magic link, Google) | `app/login`, `app/auth/callback`, `middleware.ts` |
| Data access | `lib/api.ts` (browser → Supabase) |
| Scoring, weekly quota, points, badges | Postgres functions `start_attempt`, `submit_attempt`, `award_badges` |
| Answer keys | `question_keys` table — no client access; revealed per attempt via `get_attempt_review` after submit |
| Leaderboards | `leaderboard(kind, test_id, limit)` — `weekly`, `overall`, `test`, `points` |
| Payments | `app/api/razorpay/{order,verify,webhook}` → `activate_pro()` |
| Prices | `lib/plans.ts` (placeholders) — keep `days` in sync with `activate_pro()` |
| Deep analysis (Pro) | `lib/scoring.ts`, gated in the UI by `ProGate` |

Points: +10 and +score (if positive) for a first attempt at a paper, +5 for a reattempt, plus each badge's points.

Old tables from the previous version were moved to the `legacy` schema (not exposed through the API). Drop it when no longer needed.

## One-time setup checklist
**Supabase dashboard → Authentication**
1. *URL Configuration*: Site URL `https://tayyari.online`; add redirect URLs `http://localhost:3001/auth/callback` and `https://tayyari.online/auth/callback`.
2. *Providers → Phone*: enable and connect an SMS provider (MSG91 / Twilio / Vonage / Textlocal).
3. *Providers → Google*: enable; paste a Google Cloud OAuth client ID + secret (authorised redirect URI: `https://xgukepyyaplsyiaifjji.supabase.co/auth/v1/callback`).
4. *Providers → Email*: on by default. To show a 6-digit code, add `{{ .Token }}` to the Magic Link email template. Set up custom SMTP before launch (the built-in sender is heavily rate-limited).

**Env (`.env.local`, and your host's env for production)**
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase → Project Settings → API keys (secret). Used only by the payment routes.
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` — Razorpay → Account & Settings → API Keys (start with test mode).
- `RAZORPAY_WEBHOOK_SECRET` — Razorpay → Webhooks → add `https://tayyari.online/api/razorpay/webhook` with events `payment.captured` and `order.paid`.

## Content
`supabase/seed.sql` holds the badge catalogue and 36 sample questions / 7 tests. Add real questions to `questions` + `question_keys` and assemble papers in `tests` + `test_questions`.

## Sample students on leaderboards
Leaderboards include 10 sample students from the `demo_players` table (scores are generated per paper by `demo_score()`), so boards don't look empty at launch. Remove them with:
```sql
delete from public.demo_players;
```

## Icons
3D icons are Microsoft Fluent Emoji (MIT licence), loaded from jsDelivr and pinned to one commit in `components/Icon3D.tsx`.

# Markwise

Markwise is an A Level revision app for three specs:

- Pearson Edexcel Business (9BS0)
- AQA Psychology (7182)
- Pearson Edexcel Politics (9PL0)

Students confirm those subjects, get a daily plan from their weakest topics, write original exam-style answers, and receive a levels-based mark. A tutor gives hints and will not write the essay. Progress is a simple Bayesian knowledge trace against a target grade.

Questions, mark schemes and exemplar answers are written for Markwise. They are not past-paper text.

## Run it with no keys

```bash
cd apps/markwise
npm install
npm run dev
```

Open http://localhost:3000. With nothing in `.env.local` the app signs you in as the demo student Aisha, stores data in embedded Postgres (`.data/pglite`, gitignored), and marks with a local practice marker. No card, no account, no network call to a model.

## Add the free stack

Copy `.env.example` to `.env.local`. Every service below has a no-card free tier. Do not attach a billing account.

1. **Database — Neon Free.** Create a project at https://console.neon.tech and paste the pooled connection string into `DATABASE_URL`. The schema is applied on boot (`lib/schema-sql.ts`). If `DATABASE_URL` is empty, Markwise uses local PGlite instead.
2. **Auth — Clerk Hobby.** Create an application at https://dashboard.clerk.com. Put `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env.local`. Set the sign-in and sign-up paths to `/sign-in` and `/sign-up`. Both keys are required; one without the other stays in demo mode.
3. **Marker — Gemini API free tier.** Create a key in Google AI Studio and set `GEMINI_API_KEY`. Leave billing unlinked. If that project cannot call `gemini-2.5-flash`, set `GEMINI_MODEL` to a free model id shown in AI Studio (for example `gemini-2.5-flash-lite`).
4. **Optional fallback — Groq.** Set `GROQ_API_KEY` only if signup does not ask for a card. Markwise calls Groq when Gemini is missing or returns an error such as 429.

Deploy target, when you choose to deploy, is **Vercel Hobby** with the project root set to `apps/markwise`. This repository does not deploy or mark a pull request ready.

## Daily caps

Each student gets 25 extended marks and 50 tutor replies per UK calendar day. The counters live in `ai_usage`. Identical extended answers are cached, and a cache hit does not spend a mark. Short answers and multiple choice are marked from the mark scheme and do not spend the cap.

## Personal data

The account name is used only for the greeting. Before a prompt is built, Markwise removes that name, email addresses and phone numbers. Prompts contain the subject, spec, topic, question and answer. They do not contain the user id or email.

Gemini's free tier may use content to improve Google products. Do not type real names, schools or contact details into answers, and do not use this build with real students until that is accepted.

If a message looks like a crisis, the tutor does not call a model. It points to Childline (0800 1111) and Samaritans (116 123). The same line is on the tutor screen.

## Scripts

```bash
npm test          # unit tests for the plan, caps, marking and redaction
npm run typecheck
npm run lint
npm run dev
npm run build
```

Delete `.data` to reseed the local demo. Catalog rows are inserted with `ON CONFLICT DO NOTHING`, so a fresh data directory is the way to pick up question edits.

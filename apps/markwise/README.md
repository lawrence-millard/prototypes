# Markwise

A Level revision for Pearson Edexcel Business (9BS0), AQA Psychology (7182), and Pearson Edexcel Politics (9PL0).

Production: https://markwise.millard.ink

Clerk: https://clerk.millard.ink

```bash
cd apps/markwise
npm install
npm run dev
```

Copy `.env.example` to `.env.local`. `DATABASE_URL` is a Neon connection string. On Vercel it is required. Locally, an empty `DATABASE_URL` uses embedded Postgres in `.data/pglite`.

User answers, drafts, marks, and tutor threads are stored in Postgres. The only browser storage is the theme.

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

Set the Vercel project root to `apps/markwise`.

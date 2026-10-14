# Hookbox

Private webhook inbox. Production: https://hookbox.millard.ink

Clerk: https://clerk.millard.ink

Password login stays on when either Clerk key is empty. When both keys are set, only verified addresses in `ALLOWED_EMAILS` can open the dashboard. Ingest URLs do not use Clerk.

```bash
cd apps/hookbox
npm install
npm run hash-password
npm run dev
```

`DATABASE_URL` is a Neon connection string. Webhooks and messages are stored in Postgres.

```bash
npm test
npm run build
npm run test:e2e
```

Set the Vercel project root to `apps/hookbox`.

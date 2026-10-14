# status

Uptime checks for URLs you add. Checks run when you open the page and when you refresh. Private and local addresses are refused. Rows follow the Clerk user across devices.

```bash
npm install
npm run dev
```

Production: https://status.millard.ink. Clerk Frontend API: https://clerk.millard.ink.

## Env

Copy `.env.example` to `.env.local`.

| Name | What |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Publishable key for the shared Clerk instance. |
| `CLERK_SECRET_KEY` | Secret key for the same Clerk instance. Both keys are required together. |
| `DATABASE_URL` | Neon Postgres connection string. `status_*` tables are created on first use. |

In Clerk, allow `https://status.millard.ink` and set the sign-in and sign-up paths to `/sign-in` and `/sign-up`.

# poll

Create a poll and share its link. Each signed-in user can vote once. Polls and votes follow the Clerk user across devices.

```bash
npm install
npm run dev
```

Production: https://poll.millard.ink. Clerk Frontend API: https://clerk.millard.ink.

## Env

Copy `.env.example` to `.env.local`.

| Name | What |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Publishable key for the shared Clerk instance. |
| `CLERK_SECRET_KEY` | Secret key for the same Clerk instance. Both keys are required together. |
| `DATABASE_URL` | Neon Postgres connection string. `poll_*` tables are created on first use. |

In Clerk, allow `https://poll.millard.ink` and set the sign-in and sign-up paths to `/sign-in` and `/sign-up`.

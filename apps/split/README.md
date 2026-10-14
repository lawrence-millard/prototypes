# split

Group expenses and the transfers that settle them. Everything is stored for the signed-in Clerk user and shows up on each device.

```bash
npm install
npm run dev
```

Production: https://split.millard.ink. Clerk Frontend API: https://clerk.millard.ink.

## Env

Copy `.env.example` to `.env.local`.

| Name | What |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Publishable key for the shared Clerk instance. |
| `CLERK_SECRET_KEY` | Secret key for the same Clerk instance. Both keys are required together. |
| `DATABASE_URL` | Neon Postgres connection string. `split_*` tables are created on first use. |

In Clerk, allow `https://split.millard.ink` and set the sign-in and sign-up paths to `/sign-in` and `/sign-up`.

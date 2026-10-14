# marks

Bookmarks with tags for the signed-in user. Rows live in Postgres and follow the Clerk user across devices.

```bash
npm install
npm run dev
```

Production: https://marks.millard.ink. Clerk Frontend API: https://clerk.millard.ink.

## Env

Copy `.env.example` to `.env.local`.

| Name | What |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Publishable key for the shared Clerk instance. |
| `CLERK_SECRET_KEY` | Secret key for the same Clerk instance. Both keys are required together. |
| `DATABASE_URL` | Neon Postgres connection string. `marks_*` tables are created on first use. |

In Clerk, allow `https://marks.millard.ink` and set the sign-in and sign-up paths to `/sign-in` and `/sign-up`.

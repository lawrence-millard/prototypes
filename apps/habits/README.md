# habits

https://habits.millard.ink

Daily habits for the signed-in Clerk user. Names and check marks live in Postgres and match across devices. Days are UTC.

## Environment

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — shared Clerk publishable key. Required at build time.
- `CLERK_SECRET_KEY` — shared Clerk secret key.
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` — `/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` — `/sign-up`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` — `/`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` — `/`
- `DATABASE_URL` — Neon Postgres connection string.

Clerk frontend API: `https://clerk.millard.ink`. Allow `https://habits.millard.ink` on that instance.

`habits_habits`, `habits_checks`, and `habits_rate_limits` are created on the first query.

## Scripts

```bash
npm install
npm test
npm run build
npm run test:e2e
```

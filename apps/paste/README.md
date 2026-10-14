# paste

https://paste.millard.ink

Private pastes with an expiry. Each row belongs to the signed-in Clerk user and is read back from Postgres on every device.

## Environment

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — shared Clerk publishable key. Required at build time.
- `CLERK_SECRET_KEY` — shared Clerk secret key.
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` — `/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` — `/sign-up`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` — `/`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` — `/`
- `DATABASE_URL` — Neon Postgres connection string.

Clerk frontend API: `https://clerk.millard.ink`. Allow `https://paste.millard.ink` on that instance.

`paste_pastes` and `paste_rate_limits` are created on the first query.

`PREVIEW=1` renders sample rows for local screenshots. Leave it unset in production.

## Scripts

```bash
npm install
npm test
npm run build
npm run test:e2e
```

# notes

https://notes.millard.ink

Private markdown notes for the signed-in Clerk user. The note body is stored in Postgres and opened from any device.

## Environment

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — shared Clerk publishable key. Required at build time.
- `CLERK_SECRET_KEY` — shared Clerk secret key.
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` — `/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` — `/sign-up`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` — `/`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` — `/`
- `DATABASE_URL` — Neon Postgres connection string.

Clerk frontend API: `https://clerk.millard.ink`. Allow `https://notes.millard.ink` on that instance.

`notes_notes` and `notes_rate_limits` are created on the first query.

## Scripts

```bash
npm install
npm test
npm run build
npm run test:e2e
```

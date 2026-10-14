# go

https://go.millard.ink

Short links for the signed-in account. `/l/{code}` redirects. Rows live in Postgres and follow the Clerk user across devices.

## Environment

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — shared Clerk publishable key. Required at build time.
- `CLERK_SECRET_KEY` — shared Clerk secret key.
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` — `/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` — `/sign-up`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` — `/`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` — `/`
- `DATABASE_URL` — Neon Postgres connection string.

Clerk frontend API: `https://clerk.millard.ink`. Allow `https://go.millard.ink` on that instance.

`go_links` and `go_rate_limits` are created on the first query.

## Scripts

```bash
npm install
npm test
npm run build
npm run test:e2e
```

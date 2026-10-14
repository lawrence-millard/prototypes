# soon

Countdowns. Each event has a public page at `/e/<slug>`. Events are stored in Postgres for the signed-in user.

## env

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`

`soon_events` and `soon_limits` are created on first use.

```bash
npm install
npm run dev
```

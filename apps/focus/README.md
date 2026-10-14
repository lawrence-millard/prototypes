# focus

Pomodoro timer. Finished sessions are stored in Postgres for the signed-in user.

## env

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`

`focus_sessions` and `focus_limits` are created on first use.

```bash
npm install
npm run dev
```

# Sketchpad

Whiteboard. Production: https://sketch.millard.ink

Clerk: https://clerk.millard.ink

Boards are cached in IndexedDB. When Clerk and `DATABASE_URL` are set, they sync to Postgres (`sketchpad_boards`) for that user: once on load, then in a debounced batch. Last write wins by `updatedAt`.

```bash
cd apps/sketchpad
npm install
npm run dev
```

```bash
npm test
npm run test:e2e
npm run build
```

Set the Vercel project root to `apps/sketchpad`.

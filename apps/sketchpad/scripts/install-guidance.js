console.log(`Sketchpad setup

1. Install dependencies:
   npm install

2. Install the Playwright browser used by the smoke test:
   npx playwright install chromium

3. Start the app in local single-user mode (no account, no sign-in):
   npm run dev

4. Optional Clerk sign-in:
   Copy .env.example to .env and set VITE_CLERK_PUBLISHABLE_KEY
   to a Clerk publishable key (pk_test_... or pk_live_...).
   Leave it blank to keep local mode.
   Do not add a Clerk secret key. This app has no backend.

5. Other commands:
   npm test          unit tests
   npm run test:e2e  browser smoke test
   npm run build     typecheck and production build
   npm run preview   serve the production build locally

No server, database, or third-party account is required.
Boards are stored in this browser's IndexedDB.
`)

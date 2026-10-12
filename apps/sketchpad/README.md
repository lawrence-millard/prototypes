# Sketchpad

A private browser whiteboard for the core drawing loop: create a board, add shapes and text, select, drag, resize, connect shapes with arrows, undo, and autosave. Export SVG, PNG, or a JSON backup. Import that JSON on another browser.

This is single-user. There is no realtime collaboration and no shared cursor. The only way to hand someone a board is to export a JSON file and let them import it.

Sketchpad is not affiliated with Excalidraw.

## Setup

Requirements: Node.js 20.9 or newer.

```bash
cd apps/sketchpad
npm install
npm run setup          # prints these commands
npm run dev            # http://127.0.0.1:5173
```

The Playwright smoke test needs a browser once:

```bash
npx playwright install chromium
```

| Script | What it does |
| --- | --- |
| `npm run setup` | Prints install and run guidance |
| `npm run dev` | Vite dev server |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright smoke test |
| `npm run build` | Typecheck and production build |
| `npm run preview` | Serves the production build at http://127.0.0.1:4173 |

No server and no database are required. `npm run dev` works with an empty environment.

## Two modes

### Local (default)

Leave `VITE_CLERK_PUBLISHABLE_KEY` unset or blank. There is no sign-in, no account, and the app does not load Clerk. Boards are stored for the owner id `local`.

Copy `.env.example` to `.env` only if you want the optional key. `.env.example` lists no required secrets. This app has no backend and does not read `CLERK_SECRET_KEY`.

### Clerk sign-in (optional)

If you already use one Clerk application across your apps, paste that application's **publishable** key into `.env`:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

Sketchpad does not create its own Clerk application. When the key is set and looks like `pk_test_` or `pk_live_`, the editor stays behind Clerk sign-in. Boards are still written only to IndexedDB, in a namespace for that Clerk user id. They are not uploaded to Clerk and they are not synced across devices.

Clear the variable and reload to return to local mode. Local boards and signed-in boards do not share a namespace, so switching modes does not delete either set; each one is listed on its own.

If the variable is non-empty but not a publishable key, the app shows a configuration error and does not call Clerk.

Unit tests and the Playwright smoke test force the variable empty, so they always run in local mode.

## Permissions

Sketchpad does not ask for camera, microphone, location, notification, or clipboard permission. It uses IndexedDB in the site's own origin. The browser can still evict that storage.

With the Clerk key unset, the app does not contact an auth service. With the key set, loading sign-in contacts Clerk. Board contents are not part of that request.

There is no analytics, telemetry, or advertising.

## Architecture

- React and TypeScript render the board list and the SVG canvas.
- Shape positions live on the board. A connector stores the two shape ids, not a fixed line. Endpoints are calculated from the current bounds, so a move or resize keeps the arrow attached.
- Undo and redo keep an in-memory history for the open board. Autosave writes the latest board to IndexedDB after a short pause, and again when you leave the board or press Ctrl/Cmd+S.
- Import parses JSON and rejects it unless it matches the Sketchpad file schema: known fields only, size limits, finite numbers, hex colors, and connectors that point at shapes in the file. Validation errors do not include the file body.
- Clerk is a separate chunk. It is imported only when a plausible publishable key is set.

## Data location

IndexedDB database `sketchpad`, version 1.

| Store | Contents |
| --- | --- |
| `boards` | One record per board. Key is the URL-encoded owner id, a slash, and the URL-encoded board id. Index `byOwner` lists a person's boards. |
| `meta` | Whether the labelled sample board has already been offered to that owner. |

Owner id is `local`, or the Clerk user id when sign-in is on. In Chromium, inspect it under DevTools → Application → IndexedDB → `sketchpad`.

The first visit for an owner adds one board named `Sample: personal whiteboard`. **Delete sample data** removes every board marked sample and does not add it back. **Add sample board** puts it back.

## Backup

Open a board and choose **Export → Download JSON**. That file is the backup. **Import JSON** on the board list creates a new board from it. SVG and PNG are pictures, not backups. There is no cloud copy.

## Limitations

- No realtime multiplayer, comments, presence, or share links.
- No Excalidraw file import, no SVG or PDF import, no template library, no presentation mode, no teams or admin controls.
- Connectors are straight arrows between shape edges. There is no freehand pen.
- Undo history lasts for the editing session. IndexedDB keeps the latest saved board, not every undo step.
- PNG export is drawn by the browser and is capped at 2048 pixels on the long side. It can fail; the dialog says so.
- Data is as private as this browser profile. Sketchpad does not encrypt IndexedDB.
- A Clerk account does not copy boards to another computer. Export JSON if you want a copy elsewhere.
- Deleting site data in the browser deletes the boards.

## Tests

```bash
npm test
npm run test:e2e
npm run build
npm run preview
```

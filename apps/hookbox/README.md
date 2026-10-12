# Hookbox

Hookbox is a private inbox for Discord-style webhooks. You create a webhook in the dashboard, copy its URL once, and point Discord (or anything else that can `POST`) at it. Messages land in Postgres and show up on that webhook's page.

It is a Next.js App Router app meant for the Vercel Hobby plan and a Neon free database. It does not use paid Vercel storage, KV, Blob, or cron.

## What it accepts

`POST /api/hook/<id>/<token>` returns **204** with an empty body, the same way Discord does.

- JSON bodies with `content`, `username`, `avatar_url`, and `embeds`
- `multipart/form-data` with a `payload_json` field and file parts (`files[0]`, and any other file field)
- Any other JSON value or plain text

Anything else about the request is stored with it: the sender IP, an allowlist of headers, the content type, and the raw body (up to 1 MiB). A wrong id or token is **404**. There is one shared inbox user; webhooks are not public.

## Local setup

Use Node.js 20 or newer.

```bash
cd apps/hookbox
npm install
cp .env.example .env.local
```

Create a Neon project on the free plan and put its connection string in `DATABASE_URL`. `@neondatabase/serverless` sends each query to Neon's HTTPS SQL API, so a Postgres URL from another host will not work.

Generate the session secret and the bcrypt hash in a shell:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
printf '%s' 'a-long-password-here' | npm run hash-password
```

Put the first value in `SESSION_SECRET` (at least 32 characters). The hash script prints an `ADMIN_PASSWORD_HASH=...` line with each `$` escaped as `\$`. Paste that line as-is. Next.js expands `$` in `.env` files, including inside quotes, so an unescaped bcrypt hash is corrupted and login refuses it. Set `ADMIN_USERNAME` to whatever you want to type at login. The script refuses passwords passed as arguments so they do not land in shell history. Passwords must be 12–200 characters. The hash is bcrypt with cost 12.

Leave the Clerk keys blank to keep that username and password. To use Clerk instead, set both `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`, and set `ALLOWED_EMAILS` to a comma-separated list of the addresses that may open the dashboard. Comparison is case-insensitive. An address counts only after Clerk has verified it. If either Clerk key is missing, Hookbox stays on the username login. If both keys are set and the allow list is empty, nobody can open the dashboard. Ingest URLs do not use Clerk.

```bash
npm run dev
```

Open `http://localhost:3000`, sign in, and create a webhook. Copy the URL it shows. That screen is the only place the token exists; the database stores `SHA-256(token)`.

Tables are created on the first query. You do not run a migration by hand.

## Discord

In a channel, create a webhook and paste the Hookbox URL as the webhook URL. Discord will `POST` JSON for normal messages and multipart bodies when a message includes files. File bytes stay inside the stored raw body. The dashboard lists the file name, type, and size, and does not fetch remote images.

## Dashboard

The home page and the sidebar list every webhook with its message count. Each webhook has its own page at `/hooks/<id>`:

- messages newest first, up to 50
- Discord-style content and embeds rendered as React text, never as HTML
- raw JSON and the stored body
- a refresh about every 5 seconds
- delete one message, or rename, regenerate, or delete the webhook

Regenerating a token replaces the hash immediately. The previous URL starts returning 404. The new URL is shown once, with a copy button.

## Security

- The ingest token is 32 random bytes. Lookup is by webhook id, then `SHA-256` of the provided token is compared to the stored hash with `timingSafeEqual`. A miss is 404.
- Request bodies over 1 MiB are rejected with 413. Each IP is limited to 60 ingest requests per minute. Once that budget is spent, further requests get 429 before the token is checked. Under the limit, a wrong id or token is 404.
- Login uses `ADMIN_USERNAME` and a bcrypt `ADMIN_PASSWORD_HASH` unless both Clerk keys are set. The username is compared by hashing both sides. A wrong username still runs bcrypt against a dummy hash. Five failures from one IP within 15 minutes lock that IP out for 15 minutes. With Clerk, the password form is not accepted, and a signed-in user must have a verified email in `ALLOWED_EMAILS`. Anyone else is sent to `/forbidden` before webhook data is loaded.
- Password sessions are HMAC-signed cookies named `__Host-hookbox`: `HttpOnly`, `Secure`, `SameSite=Strict`, 12 hours, no `Domain` attribute. Clerk sessions stay in Clerk's cookies. Next.js 16 calls the request guard `proxy.ts` (the replacement for `middleware.ts`). It redirects every page except `/login`, Clerk's sign-up and handshake routes, and `/api/hook/...`. Server actions check the session again.
- Responses send a nonce-based Content-Security-Policy (`script-src` with a nonce and `strict-dynamic`, no `unsafe-inline`), HSTS, `X-Frame-Options: DENY`, `nosniff`, `no-referrer`, and `X-Robots-Tag: noindex`. `upgrade-insecure-requests` is added only on HTTPS, so local `http://localhost` still loads. When Clerk is on, Clerk's strict policy is used instead: the same nonce and `strict-dynamic` script rules, plus Clerk's Frontend API, `https://*.protect.clerk.com`, Cloudflare challenges, and `https://img.clerk.com`. Clerk components need `style-src 'unsafe-inline'`. `frame-ancestors` stays `'none'`. `Cross-Origin-Opener-Policy` is `same-origin` for password login and `same-origin-allow-popups` for Clerk so OAuth popups can return. `robots.txt` disallows everything.
- Message text is escaped by React. Links are rendered only for `http:` and `https:` URLs. Remote avatar and embed images are shown as text, not loaded. The only `NEXT_PUBLIC_` variable is the Clerk publishable key, which is meant for the browser. `CLERK_SECRET_KEY` stays on the server.
- Stored headers are an allowlist (`user-agent`, `content-type`, `accept`, and a few similar fields). `Authorization` and `Cookie` are dropped.

Platform access logs can still record the request path, which contains the token. Treat the webhook URL like a Discord webhook URL.

## Deploy on Vercel Hobby

Create a Vercel project with the root directory set to `apps/hookbox`. Add the same environment variables as `.env.local`, including the Clerk keys and `ALLOWED_EMAILS` if you want Clerk. The publishable key is read into the browser bundle at build time, so change it and build again before it takes effect. Do not add Vercel Postgres, KV, Blob, or other paid storage; the database stays on Neon.

Vercel builds the app with those variables present, which the session check needs. Do not commit `.env`, `.env.local`, or a real `DATABASE_URL`. This repository's setup does not deploy or merge on its own.

The first request after Neon scales to zero creates the tables and pays a cold start. Later requests reuse the serverless function's schema check.

## Scripts

```bash
npm test
npm run build
npm run hash-password
```

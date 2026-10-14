# secret

One-time links. The browser encrypts with AES-GCM. The key stays in the URL fragment and is not sent to the server. Postgres stores ciphertext and the IV. The row is deleted on the first open, or when it is expired.

## env

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`

`secret_links` and `secret_limits` are created on first use.

```bash
npm install
npm run dev
```

# prototypes

| app | host |
| --- | --- |
| [focus](apps/focus) | focus.millard.ink |
| [cards](apps/cards) | cards.millard.ink |
| [soon](apps/soon) | soon.millard.ink |
| [secret](apps/secret) | secret.millard.ink |

Shared Clerk instance: `clerk.millard.ink`.

Each app needs:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`

Tables are created on first use and prefixed by app name. If a host is a Clerk satellite, set the `NEXT_PUBLIC_CLERK_IS_SATELLITE`, `NEXT_PUBLIC_CLERK_DOMAIN`, and `NEXT_PUBLIC_CLERK_SIGN_IN_URL` variables Clerk documents for that host.

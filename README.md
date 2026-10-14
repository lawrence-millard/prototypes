# prototypes

| App | Path | Host |
| --- | --- | --- |
| marks | `apps/marks` | https://marks.millard.ink |
| status | `apps/status` | https://status.millard.ink |
| poll | `apps/poll` | https://poll.millard.ink |
| split | `apps/split` | https://split.millard.ink |

Each app is its own Next.js project. They share one Clerk instance (`https://clerk.millard.ink`) and one Neon database. Tables are prefixed by the app name. See the README in each app for env vars.

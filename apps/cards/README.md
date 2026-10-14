# cards

Flashcard decks with spaced repetition. Decks, cards, and review state are stored in Postgres for the signed-in user.

## env

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`

`cards_decks`, `cards_cards`, and `cards_limits` are created on first use.

```bash
npm install
npm run dev
```

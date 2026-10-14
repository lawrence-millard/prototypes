import { Shell } from '@/components/shell'

export default function NotFound() {
  return (
    <Shell mark="c" name="cards">
      <p className="dim">not found.</p>
      <p className="account"><a href="/">decks</a></p>
    </Shell>
  )
}

'use client'

import { Shell } from '@/components/shell'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <Shell mark="c" name="cards">
      <div className="stack">
        <p className="err" role="alert">could not load.</p>
        <button type="button" className="ghost" onClick={() => reset()}>retry</button>
      </div>
    </Shell>
  )
}

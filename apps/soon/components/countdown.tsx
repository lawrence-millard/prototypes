'use client'

import { useEffect, useState } from 'react'
import { remainingLabel } from '@/lib/remain'

export function Countdown({ iso }: { iso: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return <p className="time mono">{remainingLabel(iso, now)}</p>
}

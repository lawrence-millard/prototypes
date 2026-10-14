export function remainingLabel(targetIso: string, now: number) {
  const diff = new Date(targetIso).getTime() - now
  if (!Number.isFinite(diff) || diff <= 0) return 'passed'
  const total = Math.floor(diff / 1000)
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
}

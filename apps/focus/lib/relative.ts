export function relativeTime(iso: string, now = Date.now()) {
  const delta = Math.round((now - new Date(iso).getTime()) / 1000)
  const abs = Math.abs(delta)
  const future = delta < 0
  const suffix = future ? '' : ' ago'
  const prefix = future ? 'in ' : ''
  if (abs < 45) return 'just now'
  const minutes = Math.round(abs / 60)
  if (minutes < 60) return `${prefix}${minutes}m${suffix}`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${prefix}${hours}h${suffix}`
  const days = Math.round(hours / 24)
  if (days === 1) return future ? 'tomorrow' : 'yesterday'
  if (days < 14) return `${prefix}${days}d${suffix}`
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(iso))
}

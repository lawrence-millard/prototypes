export function isPublicPath(pathname: string): boolean {
  const path = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  if (path === '/login' || path.startsWith('/login/')) return true
  if (path === '/sign-up' || path.startsWith('/sign-up/')) return true
  if (path === '/forbidden') return true
  if (path === '/robots.txt') return true
  if (path === '/__clerk' || path.startsWith('/__clerk/')) return true
  return path.startsWith('/api/hook/')
}

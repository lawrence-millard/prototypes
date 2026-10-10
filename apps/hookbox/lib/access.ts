export function isPublicPath(pathname: string): boolean {
  const path = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  return path === '/login' || path === '/robots.txt' || path.startsWith('/api/hook/')
}

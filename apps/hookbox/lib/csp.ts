export function buildContentSecurityPolicy(
  nonce: string,
  options: { dev: boolean; https: boolean },
): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${options.dev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "worker-src 'none'",
    "manifest-src 'self'",
  ]
  if (options.https) directives.push('upgrade-insecure-requests')
  return directives.join('; ')
}

export function clerkCspDirectives(https: boolean): Record<string, string[]> {
  const directives: Record<string, string[]> = {
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'manifest-src': ["'self'"],
  }
  if (https) directives['upgrade-insecure-requests'] = ['']
  return directives
}

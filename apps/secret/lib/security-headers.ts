export type Header = { key: string; value: string }

export function securityHeaders(input: {
  nodeEnv: string
  publishableKey: string
  referrer: string
}): Header[] {
  const hosts = new Set<string>(['https://clerk.millard.ink'])
  const payload = input.publishableKey.replace(/^pk_(test|live)_/, '')
  if (payload) {
    try {
      const decoded = Buffer.from(payload, 'base64').toString('utf8').replace(/\$$/, '')
      if (/^[a-z0-9.-]+$/i.test(decoded) && decoded.includes('.')) hosts.add(`https://${decoded}`)
    } catch {
      hosts.clear()
      hosts.add('https://clerk.millard.ink')
    }
  }
  const hostList = [...hosts].join(' ')
  const dev = input.nodeEnv === 'production' ? '' : " 'unsafe-eval'"
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev} ${hostList} https://challenges.cloudflare.com https://*.protect.clerk.com`,
    `connect-src 'self' ${hostList} https://api.clerk.com https://challenges.cloudflare.com https://*.protect.clerk.com:*`,
    "img-src 'self' data: blob: https://img.clerk.com",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "worker-src 'self' blob:",
    `frame-src 'self' ${hostList} https://challenges.cloudflare.com https://*.protect.clerk.com`,
    `form-action 'self' ${hostList}`,
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    ...(input.nodeEnv === 'production' ? ['upgrade-insecure-requests'] : []),
  ].join('; ')

  return [
    { key: 'Content-Security-Policy', value: csp },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: input.referrer },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'X-DNS-Prefetch-Control', value: 'off' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
    { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
    { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  ]
}

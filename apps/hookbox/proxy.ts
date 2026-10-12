import { NextResponse } from 'next/server'
import type { NextFetchEvent, NextRequest } from 'next/server'
import { isPublicPath } from './lib/access'
import { handleClerkProxy } from './lib/clerk-proxy'
import { clerkEnabled } from './lib/clerk-mode'
import { buildContentSecurityPolicy } from './lib/csp'
import { COOKIE_NAME } from './lib/constants'
import { requestIsHttps } from './lib/http'
import { verifySessionToken } from './lib/session'

const SECURITY_HEADERS: ReadonlyArray<readonly [string, string]> = [
  ['Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload'],
  ['X-Frame-Options', 'DENY'],
  ['X-Content-Type-Options', 'nosniff'],
  ['Referrer-Policy', 'no-referrer'],
  ['X-Robots-Tag', 'noindex, nofollow, noarchive'],
  [
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), clipboard-write=(self)',
  ],
  ['Cross-Origin-Resource-Policy', 'same-origin'],
  ['X-DNS-Prefetch-Control', 'off'],
  ['X-Permitted-Cross-Domain-Policies', 'none'],
  ['Cache-Control', 'no-store'],
]

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  if (clerkEnabled()) {
    const response = await handleClerkProxy(request, event)
    return withSecurity(response, null, 'same-origin-allow-popups')
  }
  return await passwordProxy(request)
}

async function passwordProxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const https = requestIsHttps(request)
  const csp = buildContentSecurityPolicy(nonce, {
    dev: process.env.NODE_ENV === 'development',
    https,
  })
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('x-hookbox-path', request.nextUrl.pathname)
  requestHeaders.set('Content-Security-Policy', csp)

  const { pathname } = request.nextUrl
  const sessionOk = await verifySessionToken(
    request.cookies.get(COOKIE_NAME)?.value,
    process.env.SESSION_SECRET,
    process.env.ADMIN_USERNAME,
  )

  if (pathname === '/login' && sessionOk) {
    return withSecurity(NextResponse.redirect(new URL('/', request.url)), csp, 'same-origin')
  }

  if (!isPublicPath(pathname) && !sessionOk) {
    if (pathname.startsWith('/api/')) {
      return withSecurity(NextResponse.json({ error: 'unauthorized' }, { status: 401 }), csp, 'same-origin')
    }
    return withSecurity(NextResponse.redirect(new URL('/login', request.url)), csp, 'same-origin')
  }

  return withSecurity(
    NextResponse.next({ request: { headers: requestHeaders } }),
    csp,
    'same-origin',
  )
}

function withSecurity(response: Response, csp: string | null, openerPolicy: string) {
  if (csp) response.headers.set('Content-Security-Policy', csp)
  response.headers.set('Cross-Origin-Opener-Policy', openerPolicy)
  for (const [key, value] of SECURITY_HEADERS) response.headers.set(key, value)
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
}

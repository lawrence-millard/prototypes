import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextFetchEvent, NextRequest } from 'next/server'
import { isPublicPath } from './access'
import { clerkUserAllowed } from './clerk-allow'
import { clerkCspDirectives } from './csp'
import { requestIsHttps } from './http'

const runClerk = clerkMiddleware(
  async (auth, request) => {
    const { pathname } = request.nextUrl
    const { userId } = await auth()

    if (userId && isAuthScreen(pathname)) {
      const destination = (await clerkUserAllowed(userId)) ? '/' : '/forbidden'
      return NextResponse.redirect(new URL(destination, request.url))
    }

    if (userId && !isPublicPath(pathname) && !(await clerkUserAllowed(userId))) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/forbidden', request.url))
    }

    if (!userId && !isPublicPath(pathname)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-hookbox-path', pathname)
    return NextResponse.next({ request: { headers: requestHeaders } })
  },
  (request) => ({
    signInUrl: '/login',
    signUpUrl: '/sign-up',
    contentSecurityPolicy: {
      strict: true,
      directives: clerkCspDirectives(requestIsHttps(request)),
    },
  }),
)

export async function handleClerkProxy(request: NextRequest, event: NextFetchEvent): Promise<Response> {
  const response = await runClerk(request, event)
  return response ?? NextResponse.next()
}

function isAuthScreen(pathname: string): boolean {
  const path = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  return path === '/login' || path.startsWith('/login/') || path === '/sign-up' || path.startsWith('/sign-up/')
}

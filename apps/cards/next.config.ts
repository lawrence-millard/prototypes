import type { NextConfig } from 'next'
import { securityHeaders } from './lib/security-headers'

process.env.CLERK_TELEMETRY_DISABLED = '1'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  env: {
    CLERK_TELEMETRY_DISABLED: '1',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders({
          nodeEnv: process.env.NODE_ENV ?? 'production',
          publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '',
          referrer: 'strict-origin-when-cross-origin',
        }),
      },
    ]
  },
}

export default nextConfig

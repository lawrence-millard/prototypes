import type { NextConfig } from "next"

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  "https://clerk.millard.ink",
  "https://*.clerk.accounts.dev",
  "https://*.clerk.com",
  "https://challenges.cloudflare.com",
]

if (process.env.NODE_ENV !== "production") scriptSrc.push("'unsafe-eval'")

const csp = [
  "default-src 'self'",
  `script-src ${scriptSrc.join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://img.clerk.com",
  "font-src 'self'",
  "connect-src 'self' https://clerk.millard.ink https://*.clerk.accounts.dev https://*.clerk.com https://api.clerk.com https://*.protect.clerk.com:*",
  "frame-src 'self' https://clerk.millard.ink https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://clerk.millard.ink https://*.clerk.accounts.dev https://*.clerk.com",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
].join("; ")

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=(), clipboard-write=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig

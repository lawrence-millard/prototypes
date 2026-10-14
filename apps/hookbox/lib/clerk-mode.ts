export type AllowlistEmail = {
  emailAddress: string
  verification: { status: string | null } | null
}

type ClerkEnv = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string
  CLERK_SECRET_KEY?: string
}

export function clerkEnabled(env?: ClerkEnv): boolean {
  const source = env ?? {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  }
  const publishable = source.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? ''
  const secret = source.CLERK_SECRET_KEY?.trim() ?? ''
  return publishable.length > 0 && secret.length > 0
}

export function parseAllowedEmails(raw: string | undefined): Set<string> {
  const emails = new Set<string>()
  for (const part of (raw ?? '').split(',')) {
    const email = part.trim().toLowerCase()
    if (!email.includes('@') || email.includes(' ')) continue
    emails.add(email)
  }
  return emails
}

export function emailIsAllowed(
  addresses: readonly AllowlistEmail[],
  allowlist: ReadonlySet<string>,
): boolean {
  for (const address of addresses) {
    if (address.verification?.status !== 'verified') continue
    const email = address.emailAddress.trim().toLowerCase()
    if (allowlist.has(email)) return true
  }
  return false
}

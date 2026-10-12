import { emailIsAllowed, parseAllowedEmails, type AllowlistEmail } from './clerk-mode'
import { sanitizeError } from './errors'

export async function clerkUserAllowed(userId: string): Promise<boolean> {
  try {
    const { clerkClient } = await import('@clerk/nextjs/server')
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const addresses: AllowlistEmail[] = user.emailAddresses.map((address) => ({
      emailAddress: address.emailAddress,
      verification: address.verification ? { status: address.verification.status } : null,
    }))
    return emailIsAllowed(addresses, parseAllowedEmails(process.env.ALLOWED_EMAILS))
  } catch (error) {
    console.error('clerk_allowlist_failed', sanitizeError(error))
    return false
  }
}

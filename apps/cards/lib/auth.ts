import 'server-only'
import { auth } from '@clerk/nextjs/server'
import { cache } from 'react'

export const currentUserId = cache(async () => {
  const { userId } = await auth()
  return userId ?? null
})

import { lazy, Suspense } from 'react'
import { useSession } from '../auth/session'

const UserButton = lazy(async () => {
  const module = await import('@clerk/clerk-react')
  return { default: module.UserButton }
})

export function AccountButton() {
  const session = useSession()
  if (session.mode !== 'clerk') return null
  return (
    <Suspense fallback={<span className="user-fallback">Account</span>}>
      <UserButton />
    </Suspense>
  )
}

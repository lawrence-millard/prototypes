import { Suspense } from 'react'
import { AuthForm } from '@/components/auth-form'
import { Shell } from '@/components/shell'

export default function SignInPage() {
  return (
    <Shell menu={null} mark="c" name="cards">
      <Suspense fallback={<p className="dim">loading</p>}>
        <AuthForm mode="in" />
      </Suspense>
    </Shell>
  )
}

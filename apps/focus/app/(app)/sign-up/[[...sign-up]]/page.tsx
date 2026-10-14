import { Suspense } from 'react'
import { AuthForm } from '@/components/auth-form'
import { Shell } from '@/components/shell'

export default function SignUpPage() {
  return (
    <Shell menu={null} mark="f" name="focus">
      <Suspense fallback={<p className="dim">loading</p>}>
        <AuthForm mode="up" />
      </Suspense>
    </Shell>
  )
}

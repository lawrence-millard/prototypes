"use client"

import { SignIn, SignUp } from "@clerk/nextjs"
import { clerkAppearance, useDark } from "./appearance"

export function ClerkAuth({ mode }: { mode: "sign-in" | "sign-up" }) {
  const dark = useDark()
  const appearance = clerkAppearance(dark)
  const Screen = mode === "sign-in" ? SignIn : SignUp
  const path = mode === "sign-in" ? "/sign-in" : "/sign-up"
  return (
    <div className="clerk">
      <Screen
        routing="path"
        path={path}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/"
        fallbackRedirectUrl="/"
        appearance={appearance}
      />
    </div>
  )
}

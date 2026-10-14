"use client"

import { SignIn, SignUp } from "@clerk/nextjs"
import { useEffect, useState } from "react"

export function ClerkAuth({ mode }: { mode: "sign-in" | "sign-up" }) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const read = () => {
      if (root.dataset.theme === "dark") return true
      if (root.dataset.theme === "light") return false
      return window.matchMedia("(prefers-color-scheme: dark)").matches
    }
    const apply = () => setDark(read())
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] })
    return () => observer.disconnect()
  }, [])

  const fg = dark ? "#e9e9e9" : "#0b0b0b"
  const bg = dark ? "#000000" : "#f6f6f6"
  const mute = dark ? "#6e6e6e" : "#7c7c7c"
  const appearance = {
    variables: {
      colorPrimary: fg,
      colorBackground: bg,
      colorText: fg,
      colorTextSecondary: mute,
      colorInputBackground: bg,
      colorInputText: fg,
      borderRadius: "8px",
      fontFamily: '"Open Runde", "SF Pro", ui-sans-serif, system-ui, sans-serif',
      fontFamilyButtons: '"Open Runde", "SF Pro", ui-sans-serif, system-ui, sans-serif',
    },
    elements: {
      card: { boxShadow: "none", border: "1px solid rgba(124,124,124,0.35)" },
      formButtonPrimary: { boxShadow: "none" },
      socialButtonsBlockButton: { boxShadow: "none" },
      footer: { boxShadow: "none" },
    },
  }
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

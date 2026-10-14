"use client"

import { useEffect, useState } from "react"

export function useDark() {
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
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    media.addEventListener("change", apply)
    return () => {
      observer.disconnect()
      media.removeEventListener("change", apply)
    }
  }, [])

  return dark
}

export function clerkAppearance(dark: boolean) {
  const fg = dark ? "#e9e9e9" : "#0b0b0b"
  const bg = dark ? "#000000" : "#f6f6f6"
  const mute = dark ? "#6e6e6e" : "#7c7c7c"
  const line = "rgba(124,124,124,0.35)"
  const font = '"Open Runde", "SF Pro", ui-sans-serif, system-ui, sans-serif'
  return {
    variables: {
      colorPrimary: fg,
      colorBackground: bg,
      colorText: fg,
      colorTextSecondary: mute,
      colorInputBackground: bg,
      colorInputText: fg,
      colorNeutral: mute,
      borderRadius: "8px",
      fontFamily: font,
      fontFamilyButtons: font,
      fontWeight: { normal: 500, medium: 500, bold: 500 },
    },
    elements: {
      rootBox: { width: "100%" },
      cardBox: { width: "100%", boxShadow: "none" },
      card: { width: "100%", boxShadow: "none", border: `1px solid ${line}`, background: bg },
      headerTitle: { fontFamily: font, fontWeight: 500, letterSpacing: "-0.4px", color: fg },
      headerSubtitle: { color: mute },
      socialButtonsBlockButton: { boxShadow: "none", border: `1px solid ${line}` },
      formButtonPrimary: { boxShadow: "none", background: fg, color: bg, fontWeight: 500, textTransform: "none" as const },
      formFieldLabel: { color: fg, fontSize: "14px", fontWeight: 500, textTransform: "none" as const, letterSpacing: "-0.2px" },
      formFieldInput: { boxShadow: "none", border: `1px solid ${line}`, background: bg, color: fg },
      footer: { boxShadow: "none", background: "transparent" },
      footerActionLink: { color: fg },
      dividerLine: { background: line },
      identityPreview: { border: `1px solid ${line}`, boxShadow: "none" },
      userButtonPopoverCard: { boxShadow: "none", border: `1px solid ${line}`, background: bg },
      userButtonPopoverActionButton: { color: fg },
      userButtonPopoverActionButtonText: { fontFamily: font, color: fg },
      userButtonAvatarBox: { width: "32px", height: "32px" },
    },
  }
}

import Link from "next/link"
import { SignOut } from "./sign-out"

export function Header({
  name,
  mark,
  signedIn,
  href = "/sign-in",
  label = "sign in",
}: {
  name: string
  mark: string
  signedIn: boolean
  href?: string
  label?: string
}) {
  return (
    <header className="header">
      <Link href="/" className="mark" aria-label={name}>{mark}</Link>
      <h1>{name}</h1>
      <div className="account">
        {signedIn ? <SignOut /> : <Link href={href}>{label}</Link>}
      </div>
    </header>
  )
}

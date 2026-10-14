import Link from "next/link"
import { Account } from "./account"

export function Header({
  name,
  mark,
  signedIn,
  href = "/sign-in",
  label,
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
        {signedIn ? <Account /> : label ? <Link href={href}>{label}</Link> : null}
      </div>
    </header>
  )
}

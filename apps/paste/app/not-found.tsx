import Link from "next/link"

export const metadata = { title: "not found" }

export default function NotFound() {
  return (
    <main className="frame">
      <p className="alert">not found</p>
      <p><Link href="/">paste</Link></p>
    </main>
  )
}

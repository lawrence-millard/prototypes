import Link from "next/link"

export const metadata = { title: "not found" }

export default function NotFound() {
  return (
    <main className="frame">
      <div className="empty-state">
        <p>Not found</p>
        <Link className="primary" href="/">paste</Link>
      </div>
    </main>
  )
}

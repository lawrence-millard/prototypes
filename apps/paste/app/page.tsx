import { ActionForm } from "@/components/action-form"
import { Header } from "@/components/header"
import { createPasteAction } from "@/lib/actions"
import { currentUserId } from "@/lib/auth"
import type { Paste } from "@/lib/data"
import { readPastes } from "@/lib/reads"
import { excerpt, remaining } from "@/lib/time"

const errors: Record<string, string> = {
  invalid: "invalid",
  rate: "slow down",
  unavailable: "unavailable",
  missing: "missing",
  limit: "full",
}

export default async function Home({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams
  const userId = await currentUserId()
  let pastes: Paste[] = []
  let problem = false
  if (userId) {
    try {
      pastes = await readPastes(userId)
    } catch {
      problem = true
    }
  }
  const notice = e && errors[e] ? errors[e] : ""
  const now = Date.now()
  return (
    <main className="frame">
      <Header name="paste" mark="p" signedIn={Boolean(userId)} />
      <ActionForm action={createPasteAction} submit="save" errors={errors}>
        <label className="field">
          <span className="label">text</span>
          <textarea className="mono" name="body" required maxLength={20000} spellCheck />
        </label>
        <label className="field">
          <span className="label">expires</span>
          <select name="expiry" defaultValue="1d" required>
            <option value="1h">1 hour</option>
            <option value="1d">1 day</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
          </select>
        </label>
      </ActionForm>
      {notice ? <p className="alert" role="alert">{notice}</p> : null}
      {problem ? <p className="alert" role="alert">unavailable</p> : null}
      {!problem && pastes.length === 0 ? <p className="empty">no pastes</p> : null}
      {pastes.length > 0 ? (
        <section className="list">
          {pastes.map((paste) => (
            <article className="item" key={paste.id}>
              <div className="row">
                <a className="item-link" href={`/p/${paste.id}`}>{excerpt(paste.body)}</a>
                <span className="count">{remaining(paste.expiresAt, now)}</span>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  )
}

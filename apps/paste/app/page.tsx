import { ActionForm, Submit } from "@/components/action-form"
import { Header } from "@/components/header"
import { Landing } from "@/components/landing"
import { Shortcuts } from "@/components/shortcuts"
import { createPasteAction } from "@/lib/actions"
import { currentUserId } from "@/lib/auth"
import type { Paste } from "@/lib/data"
import { readPastes } from "@/lib/reads"
import { relativeTime } from "@/lib/relative"
import { excerpt, remaining } from "@/lib/time"

const errors: Record<string, string> = {
  invalid: "Invalid",
  rate: "Slow down",
  unavailable: "Unavailable",
  missing: "Missing",
  limit: "Full",
}

export default async function Home({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams
  const userId = await currentUserId()
  if (!userId) {
    return (
      <main className="frame">
        <Header name="paste" mark="p" signedIn={false} />
        <Landing />
      </main>
    )
  }
  let pastes: Paste[] = []
  let problem = false
  try {
    pastes = await readPastes(userId)
  } catch {
    problem = true
  }
  const notice = e && errors[e] ? errors[e] : ""
  const now = Date.now()
  return (
    <main className="frame">
      <Header name="paste" mark="p" signedIn />
      <ActionForm action={createPasteAction} className="surface" composer errors={errors}>
        <label>
          <span className="field-label" id="text-label">Text</span>
          <textarea className="mono" name="body" required maxLength={20000} spellCheck placeholder="Paste text" aria-labelledby="text-label" />
        </label>
        <div className="composer-foot">
          <label className="expire">
            <span className="field-label">Expires</span>
            <select name="expiry" defaultValue="1d" required aria-label="Expires">
              <option value="1h">1 hour</option>
              <option value="1d">1 day</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
            </select>
          </label>
          <span className="hint"><kbd>N</kbd></span>
          <Submit label="Save" />
        </div>
      </ActionForm>
      {notice ? <p className="alert" role="alert">{notice}</p> : null}
      {problem ? <p className="alert" role="alert">Unavailable</p> : null}
      {!problem && pastes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-mark" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4.5 2.5h5l3 3v8h-8v-11Z" stroke="currentColor" strokeWidth="1.4" /></svg>
          </div>
          <p>No pastes yet</p>
        </div>
      ) : null}
      {pastes.length > 0 ? (
        <section className="list">
          {pastes.map((paste) => (
            <article className="item" key={paste.id}>
              <div className="row">
                <a className="item-link" href={`/p/${paste.id}`}>{excerpt(paste.body)}</a>
                <time className="time" dateTime={paste.createdAt}>{relativeTime(paste.createdAt, now)}</time>
              </div>
              <p className="dim">{remaining(paste.expiresAt, now)} left</p>
            </article>
          ))}
        </section>
      ) : null}
      <Shortcuts rows={[["N", "New paste"], ["?", "Shortcuts"], ["Esc", "Close"]]} />
    </main>
  )
}

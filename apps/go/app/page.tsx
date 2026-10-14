import { headers } from "next/headers"
import { Pencil, Trash2 } from "lucide-react"
import { ActionForm, Submit } from "@/components/action-form"
import { Confirm } from "@/components/confirm"
import { Copy } from "@/components/copy-button"
import { Header } from "@/components/header"
import { Landing } from "@/components/landing"
import { Shortcuts } from "@/components/shortcuts"
import { createLinkAction, deleteLinkAction, updateLinkAction } from "@/lib/actions"
import { currentUserId } from "@/lib/auth"
import type { Link } from "@/lib/data"
import { requestOrigin } from "@/lib/origin"
import { readLinks } from "@/lib/reads"
import { relativeTime } from "@/lib/relative"

const errors: Record<string, string> = {
  invalid: "Invalid URL",
  code: "Invalid code",
  taken: "Taken",
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
        <Header name="go" mark="g" signedIn={false} />
        <Landing />
      </main>
    )
  }
  let links: Link[] = []
  let problem = false
  try {
    links = await readLinks(userId)
  } catch {
    problem = true
  }
  const header = await headers()
  const origin = requestOrigin(header.get("x-forwarded-host") ?? header.get("host"), header.get("x-forwarded-proto"))
  const notice = e && errors[e] ? errors[e] : ""
  const now = Date.now()
  return (
    <main className="frame">
      <Header name="go" mark="g" signedIn />
      <ActionForm action={createLinkAction} className="composer" composer errors={errors}>
        <div className="composer-top">
          <label className="field-label" htmlFor="url">Link</label>
          <span className="hint"><kbd>N</kbd> New link</span>
        </div>
        <div className="bar-input">
          <input id="url" className="mono" name="url" type="url" inputMode="url" autoComplete="url" required maxLength={2000} spellCheck={false} placeholder="https://example.com" />
          <input className="mono code-slot" name="code" type="text" autoComplete="off" maxLength={32} spellCheck={false} placeholder="code" aria-label="Code" />
          <Submit label="Shorten" />
        </div>
      </ActionForm>
      {notice ? <p className="alert" role="alert">{notice}</p> : null}
      {problem ? <p className="alert" role="alert">Unavailable</p> : null}
      {!problem && links.length === 0 ? (
        <div className="empty-state">
          <div className="empty-mark" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6.5 9.5 9.5 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
          </div>
          <p>No links yet</p>
        </div>
      ) : null}
      {links.length > 0 ? (
        <section className="list">
          {links.map((link) => {
            const short = `${origin}/l/${link.code}`
            return (
              <article className="item" key={link.id}>
                <div className="row">
                  <a className="code" href={`/l/${link.code}`}>{link.code}</a>
                  <time className="time" dateTime={link.createdAt}>{relativeTime(link.createdAt, now)}</time>
                </div>
                <p className="dim break">{link.url.replace(/^https?:\/\//, "")}</p>
                <div className="meta">
                  <span className="count">{link.clicks}</span>
                  <div className="actions">
                    <Copy value={short} />
                    <details>
                      <summary className="icon-btn" aria-label="Edit"><Pencil size={16} strokeWidth={1.5} /></summary>
                      <ActionForm action={updateLinkAction} errors={errors}>
                        <input type="hidden" name="id" value={link.id} />
                        <label className="field-label" htmlFor={`url-${link.id}`}>Link</label>
                        <div className="bar-input">
                          <input id={`url-${link.id}`} className="mono" name="url" type="url" inputMode="url" autoComplete="url" required maxLength={2000} spellCheck={false} defaultValue={link.url} placeholder="https://example.com" />
                          <Submit label="Save" />
                        </div>
                      </ActionForm>
                    </details>
                    <details>
                      <summary className="icon-btn" aria-label="Delete"><Trash2 size={16} strokeWidth={1.5} /></summary>
                      <div className="pop-body">
                        <p className="dim">Delete this link?</p>
                        <form action={deleteLinkAction}>
                          <input type="hidden" name="id" value={link.id} />
                          <Confirm />
                        </form>
                      </div>
                    </details>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      ) : null}
      <Shortcuts rows={[["N", "New link"], ["?", "Shortcuts"], ["Esc", "Close"]]} />
    </main>
  )
}

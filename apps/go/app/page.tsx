import { headers } from "next/headers"
import { ActionForm } from "@/components/action-form"
import { Confirm } from "@/components/confirm"
import { Copy } from "@/components/copy-button"
import { Header } from "@/components/header"
import { createLinkAction, deleteLinkAction, updateLinkAction } from "@/lib/actions"
import { currentUserId } from "@/lib/auth"
import type { Link } from "@/lib/data"
import { requestOrigin } from "@/lib/origin"
import { readLinks } from "@/lib/reads"

const errors: Record<string, string> = {
  invalid: "invalid url",
  code: "invalid code",
  taken: "taken",
  rate: "slow down",
  unavailable: "unavailable",
  missing: "missing",
  limit: "full",
}

export default async function Home({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams
  const userId = await currentUserId()
  let links: Link[] = []
  let problem = false
  if (userId) {
    try {
      links = await readLinks(userId)
    } catch {
      problem = true
    }
  }
  const header = await headers()
  const origin = requestOrigin(header.get("x-forwarded-host") ?? header.get("host"), header.get("x-forwarded-proto"))
  const notice = e && errors[e] ? errors[e] : ""
  return (
    <main className="frame">
      <Header name="go" mark="g" signedIn={Boolean(userId)} />
      <ActionForm action={createLinkAction} submit="save" errors={errors}>
        <label className="field">
          <span className="label">url</span>
          <input className="mono" name="url" type="url" inputMode="url" autoComplete="url" required maxLength={2000} spellCheck={false} />
        </label>
        <label className="field">
          <span className="label">code</span>
          <input className="mono" name="code" type="text" autoComplete="off" maxLength={32} spellCheck={false} />
        </label>
      </ActionForm>
      {notice ? <p className="alert" role="alert">{notice}</p> : null}
      {problem ? <p className="alert" role="alert">unavailable</p> : null}
      {!problem && links.length === 0 ? <p className="empty">no links</p> : null}
      {links.length > 0 ? (
        <section className="list">
          {links.map((link) => {
            const short = `${origin}/l/${link.code}`
            return (
              <article className="item" key={link.id}>
                <div className="row">
                  <a className="code" href={`/l/${link.code}`}>{link.code}</a>
                  <span className="count">{link.clicks}</span>
                </div>
                <p className="dim break">{link.url}</p>
                <div className="actions">
                  <Copy value={short} />
                  <details>
                    <summary>edit</summary>
                    <ActionForm action={updateLinkAction} submit="save" errors={errors}>
                      <input type="hidden" name="id" value={link.id} />
                      <label className="field">
                        <span className="label">url</span>
                        <input className="mono" name="url" type="url" inputMode="url" autoComplete="url" required maxLength={2000} spellCheck={false} defaultValue={link.url} />
                      </label>
                    </ActionForm>
                  </details>
                  <details>
                    <summary>delete</summary>
                    <form action={deleteLinkAction}>
                      <input type="hidden" name="id" value={link.id} />
                      <Confirm />
                    </form>
                  </details>
                </div>
              </article>
            )
          })}
        </section>
      ) : null}
    </main>
  )
}

import { notFound, redirect } from "next/navigation"
import { Pencil, Trash2 } from "lucide-react"
import { ActionForm, Submit } from "@/components/action-form"
import { Confirm } from "@/components/confirm"
import { Header } from "@/components/header"
import { deletePasteAction, updatePasteAction } from "@/lib/actions"
import { currentUserId } from "@/lib/auth"
import { readPaste } from "@/lib/reads"
import { relativeTime } from "@/lib/relative"
import { remaining } from "@/lib/time"
import { parseId } from "@/lib/validate"

const errors: Record<string, string> = {
  invalid: "Invalid",
  rate: "Slow down",
  unavailable: "Unavailable",
  missing: "Missing",
  limit: "Full",
}

export default async function PastePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!parseId(id).success) notFound()
  const userId = await currentUserId()
  if (!userId) redirect("/sign-in")
  let paste = null
  try {
    paste = await readPaste(userId, id)
  } catch {
    return (
      <main className="frame">
        <Header name="paste" mark="p" signedIn />
        <p className="alert" role="alert">Unavailable</p>
      </main>
    )
  }
  if (!paste) notFound()
  const now = Date.now()
  return (
    <main className="frame">
      <Header name="paste" mark="p" signedIn />
      <div className="row">
        <p className="dim">{remaining(paste.expiresAt, now)} left</p>
        <time className="time" dateTime={paste.createdAt}>{relativeTime(paste.createdAt, now)}</time>
      </div>
      <pre className="paste surface">{paste.body}</pre>
      <div className="actions open">
        <details>
          <summary className="icon-btn" aria-label="Edit"><Pencil size={16} strokeWidth={1.5} /></summary>
          <ActionForm action={updatePasteAction} className="surface" errors={errors}>
            <input type="hidden" name="id" value={paste.id} />
            <label>
              <span className="field-label">Text</span>
              <textarea className="mono" name="body" required maxLength={20000} defaultValue={paste.body} placeholder="Paste text" />
            </label>
            <Submit label="Save" />
          </ActionForm>
        </details>
        <details>
          <summary className="icon-btn" aria-label="Delete"><Trash2 size={16} strokeWidth={1.5} /></summary>
          <div className="pop-body">
            <p className="dim">Delete this paste?</p>
            <form action={deletePasteAction}>
              <input type="hidden" name="id" value={paste.id} />
              <Confirm />
            </form>
          </div>
        </details>
      </div>
    </main>
  )
}

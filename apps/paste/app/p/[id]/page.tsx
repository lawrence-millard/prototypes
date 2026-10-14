import { notFound, redirect } from "next/navigation"
import { ActionForm } from "@/components/action-form"
import { Confirm } from "@/components/confirm"
import { Header } from "@/components/header"
import { deletePasteAction, updatePasteAction } from "@/lib/actions"
import { currentUserId } from "@/lib/auth"
import { readPaste } from "@/lib/reads"
import { remaining } from "@/lib/time"
import { parseId } from "@/lib/validate"

const errors: Record<string, string> = {
  invalid: "invalid",
  rate: "slow down",
  unavailable: "unavailable",
  missing: "missing",
  limit: "full",
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
        <p className="alert" role="alert">unavailable</p>
      </main>
    )
  }
  if (!paste) notFound()
  return (
    <main className="frame">
      <Header name="paste" mark="p" signedIn />
      <p className="count">{remaining(paste.expiresAt, Date.now())}</p>
      <pre className="paste">{paste.body}</pre>
      <div className="actions">
        <details>
          <summary>edit</summary>
          <ActionForm action={updatePasteAction} submit="save" errors={errors}>
            <input type="hidden" name="id" value={paste.id} />
            <label className="field">
              <span className="label">text</span>
              <textarea className="mono" name="body" required maxLength={20000} defaultValue={paste.body} />
            </label>
          </ActionForm>
        </details>
        <details>
          <summary>delete</summary>
          <form action={deletePasteAction}>
            <input type="hidden" name="id" value={paste.id} />
            <Confirm />
          </form>
        </details>
      </div>
    </main>
  )
}

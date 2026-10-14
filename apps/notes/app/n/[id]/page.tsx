import { notFound, redirect } from "next/navigation"
import { Confirm } from "@/components/confirm"
import { Editor } from "@/components/editor"
import { Header } from "@/components/header"
import { deleteNoteAction, updateNoteAction } from "@/lib/actions"
import { currentUserId } from "@/lib/auth"
import { readNote } from "@/lib/reads"
import { parseId } from "@/lib/validate"

const errors: Record<string, string> = {
  invalid: "invalid",
  rate: "slow down",
  unavailable: "unavailable",
  missing: "missing",
  limit: "full",
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!parseId(id).success) return { title: "not found" }
  const userId = await currentUserId()
  if (!userId) return { title: "notes" }
  try {
    const note = await readNote(userId, id)
    return { title: note?.title ?? "not found" }
  } catch {
    return { title: "unavailable" }
  }
}

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!parseId(id).success) notFound()
  const userId = await currentUserId()
  if (!userId) redirect("/sign-in")
  let note = null
  try {
    note = await readNote(userId, id)
  } catch {
    return (
      <main className="frame">
        <Header name="notes" mark="n" signedIn />
        <p className="alert" role="alert">unavailable</p>
      </main>
    )
  }
  if (!note) notFound()
  return (
    <main className="frame">
      <Header name="notes" mark="n" signedIn />
      <Editor action={updateNoteAction} id={note.id} title={note.title} body={note.body} errors={errors} />
      <div className="actions">
        <details>
          <summary>delete</summary>
          <form action={deleteNoteAction}>
            <input type="hidden" name="id" value={note.id} />
            <Confirm />
          </form>
        </details>
      </div>
    </main>
  )
}

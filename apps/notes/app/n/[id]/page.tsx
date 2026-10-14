import { notFound, redirect } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Confirm } from "@/components/confirm"
import { Editor } from "@/components/editor"
import { Header } from "@/components/header"
import { Shortcuts } from "@/components/shortcuts"
import { deleteNoteAction, updateNoteAction } from "@/lib/actions"
import { currentUserId } from "@/lib/auth"
import { readNote } from "@/lib/reads"
import { parseId } from "@/lib/validate"

const errors: Record<string, string> = {
  invalid: "Invalid",
  rate: "Slow down",
  unavailable: "Unavailable",
  missing: "Missing",
  limit: "Full",
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
        <p className="alert" role="alert">Unavailable</p>
      </main>
    )
  }
  if (!note) notFound()
  return (
    <main className="frame">
      <Header name="notes" mark="n" signedIn />
      <Editor action={updateNoteAction} id={note.id} title={note.title} body={note.body} errors={errors} hint="Edit" />
      <div className="actions open">
        <details>
          <summary className="icon-btn" aria-label="Delete"><Trash2 size={16} strokeWidth={1.5} /></summary>
          <div className="pop-body">
            <p className="dim">Delete this note?</p>
            <form action={deleteNoteAction}>
              <input type="hidden" name="id" value={note.id} />
              <Confirm />
            </form>
          </div>
        </details>
      </div>
      <Shortcuts rows={[["N", "Title"], ["?", "Shortcuts"], ["Esc", "Close"]]} />
    </main>
  )
}
